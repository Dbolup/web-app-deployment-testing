from django.db import migrations


def rename_roles_forward(apps, schema_editor):
    TeamMember = apps.get_model('accounts', 'TeamMember')
    Invitation = apps.get_model('accounts', 'Invitation')
    TeamMember.objects.filter(role='super_admin').update(role='admin')
    TeamMember.objects.filter(role='editor').update(role='member')
    Invitation.objects.filter(role='super_admin').update(role='admin')
    Invitation.objects.filter(role='editor').update(role='member')


def rename_roles_backward(apps, schema_editor):
    TeamMember = apps.get_model('accounts', 'TeamMember')
    Invitation = apps.get_model('accounts', 'Invitation')
    TeamMember.objects.filter(role='admin').update(role='super_admin')
    TeamMember.objects.filter(role='member').update(role='editor')
    Invitation.objects.filter(role='admin').update(role='super_admin')
    Invitation.objects.filter(role='member').update(role='editor')


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(rename_roles_forward, rename_roles_backward),
    ]
