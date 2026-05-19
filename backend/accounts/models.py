import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        PROCUREMENT_OFFICER = 'procurement_officer', 'Procurement Officer'
        LEAD_OFFICER = 'lead_officer', 'Lead Procurement Officer'
        MANAGER = 'manager', 'Manager'
        ANALYST = 'analyst', 'Analyst'

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.PROCUREMENT_OFFICER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def __str__(self):
        return self.email


class Workspace(models.Model):
    class AISensitivity(models.TextChoices):
        STRICT = 'strict', 'Strict'
        BALANCED = 'balanced', 'Balanced'
        BROAD = 'broad', 'Broad'

    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=10 * 1024 * 1024 * 1024)
    ai_sensitivity = models.CharField(
        max_length=20, choices=AISensitivity.choices, default=AISensitivity.BALANCED
    )
    keywords = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def storage_used_percent(self):
        if self.storage_limit == 0:
            return 0
        return round((self.storage_used / self.storage_limit) * 100, 1)

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        REVIEWER = 'reviewer', 'Reviewer'
        MEMBER = 'member', 'Member'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PENDING = 'pending', 'Pending'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    invited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')

    def __str__(self):
        return f'{self.user.email} in {self.workspace.name} ({self.role})'


class Invitation(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(
        max_length=20, choices=TeamMember.Role.choices, default=TeamMember.Role.MEMBER
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted = models.BooleanField(default=False)

    def __str__(self):
        return f'Invitation for {self.email} to {self.workspace.name}'
