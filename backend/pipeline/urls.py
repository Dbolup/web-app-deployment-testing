from django.urls import path
from . import views

urlpatterns = [
    path('', views.PipelineItemListView.as_view(), name='pipeline_list'),
    path('kanban/', views.pipeline_kanban, name='pipeline_kanban'),
    path('send-review-email/', views.send_review_email, name='pipeline_send_review_email'),
    path('<int:pk>/', views.PipelineItemDetailView.as_view(), name='pipeline_detail'),
    path('<int:pk>/move/', views.move_pipeline_item, name='pipeline_move'),
]
