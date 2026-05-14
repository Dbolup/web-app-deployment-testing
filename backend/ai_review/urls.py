from django.urls import path
from .views import CompanyProfileView, TenderReviewView, TenderFeedbackView, SuggestedTendersView

urlpatterns = [
    path('company/', CompanyProfileView.as_view(), name='company-profile'),
    path('tenders/<str:ref_id>/review/', TenderReviewView.as_view(), name='tender-review'),
    path('tenders/<str:ref_id>/feedback/', TenderFeedbackView.as_view(), name='tender-feedback'),
    path('suggestions/', SuggestedTendersView.as_view(), name='tender-suggestions'),
]
