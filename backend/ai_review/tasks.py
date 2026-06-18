import logging

from django.tasks import task

from tenders.models import Tender
from .models import AIReview, CompanyProfile
from .services.reviewer import run_review

logger = logging.getLogger(__name__)

BULK_REVIEW_MODEL = "claude-haiku-4-5"


@task
def bulk_review_tenders(workspace_id: int, ref_ids: list[str]) -> dict:
    """
    Run AI reviews for up to 20 tenders in a workspace.
    Each tender is reviewed sequentially to avoid hammering the Claude API.
    Returns a summary dict with counts for completed/failed/skipped.
    """
    from accounts.models import Workspace

    try:
        workspace = Workspace.objects.get(pk=workspace_id)
        profile = workspace.company_profile
    except (Workspace.DoesNotExist, CompanyProfile.DoesNotExist) as exc:
        logger.error("bulk_review_tenders: workspace/profile lookup failed — %s", exc)
        return {"completed": 0, "failed": 0, "skipped": 0, "error": str(exc)}

    if not profile.onboarding_completed:
        logger.warning("bulk_review_tenders: onboarding not complete for workspace %s", workspace_id)
        return {"completed": 0, "failed": 0, "skipped": len(ref_ids), "error": "onboarding_not_complete"}

    completed = failed = skipped = 0

    for ref_id in ref_ids[:20]:
        try:
            tender = Tender.objects.get(ref_id=ref_id)
        except Tender.DoesNotExist:
            logger.warning("bulk_review_tenders: tender %s not found, skipping", ref_id)
            skipped += 1
            continue

        review, _ = AIReview.objects.get_or_create(
            tender=tender,
            workspace=workspace,
            defaults={"review_status": AIReview.ReviewStatus.PENDING},
        )
        review.review_status = AIReview.ReviewStatus.PENDING
        review.error_message = ""
        review.save(update_fields=["review_status", "error_message"])

        try:
            result = run_review(tender, profile)
        except Exception as exc:
            logger.exception("bulk_review_tenders: review failed for %s", ref_id)
            review.review_status = AIReview.ReviewStatus.FAILED
            review.error_message = str(exc)
            review.save(update_fields=["review_status", "error_message"])
            failed += 1
            continue

        review.ai_score = result.get("ai_score")
        review.feasibility_score = result.get("feasibility_score")
        review.risk_level = result.get("risk_level")
        review.capability_alignment = result.get("capability_alignment", [])
        review.executive_summary = result.get("executive_summary", "")
        review.recommendation = result.get("recommendation")
        review.rationale = result.get("rationale", "")
        review.review_status = AIReview.ReviewStatus.COMPLETED
        review.model_used = BULK_REVIEW_MODEL
        review.save()
        completed += 1

    logger.info(
        "bulk_review_tenders: workspace=%s completed=%s failed=%s skipped=%s",
        workspace_id, completed, failed, skipped,
    )
    return {"completed": completed, "failed": failed, "skipped": skipped}
