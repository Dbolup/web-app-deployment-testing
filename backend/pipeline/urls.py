from django.urls import path
from . import views

urlpatterns = [
    path('', views.PipelineItemListView.as_view(), name='pipeline_list'),
    path('kanban/', views.pipeline_kanban, name='pipeline_kanban'),
    path('<int:pk>/', views.PipelineItemDetailView.as_view(), name='pipeline_detail'),
    path('<int:pk>/move/', views.move_pipeline_item, name='pipeline_move'),
]
