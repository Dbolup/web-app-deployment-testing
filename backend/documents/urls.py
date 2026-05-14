from django.urls import path
from . import views

urlpatterns = [
    path('', views.DocumentListView.as_view(), name='document_list'),
    path('upload/', views.DocumentUploadView.as_view(), name='document_upload'),
    path('<int:pk>/', views.DocumentDetailView.as_view(), name='document_detail'),
    path('<int:pk>/process/', views.StartProcessingView.as_view(), name='document_process'),
    path('<int:pk>/sections/', views.DocumentSectionsView.as_view(), name='document_sections'),
]
