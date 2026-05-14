from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('top-tenders/', views.top_tenders, name='top_tenders'),
    path('activity/', views.ActivityListView.as_view(), name='activity_list'),
]
