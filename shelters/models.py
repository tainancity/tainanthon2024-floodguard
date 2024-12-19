# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)
    name = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()
    first_name = models.CharField(max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    action_time = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class ProcessedDataShelters(models.Model):
    shelter_id = models.TextField(primary_key=True)
    district = models.TextField(blank=True, null=True)
    name = models.TextField(blank=True, null=True)
    contact_person = models.TextField(blank=True, null=True)
    office_phone = models.TextField(blank=True, null=True)
    is_storage_point = models.TextField(blank=True, null=True)
    community = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    service_community = models.TextField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    max_capacity = models.IntegerField(blank=True, null=True)
    indoor_capacity = models.IntegerField(blank=True, null=True)
    outdoor_capacity = models.IntegerField(blank=True, null=True)
    indoor_area = models.IntegerField(blank=True, null=True)
    outdoor_area = models.IntegerField(blank=True, null=True)
    disaster_support_types = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'processed_data_shelters'


class SheltersDisastertype(models.Model):
    name = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'shelters_disastertype'


# class SheltersShelter(models.Model):
#     shelter_id = models.CharField(max_length=20)
#     district = models.CharField(max_length=50)
#     name = models.CharField(max_length=255)
#     contact_person = models.CharField(max_length=100)
#     office_phone = models.CharField(max_length=50)
#     is_storage_point = models.BooleanField()
#     community = models.CharField(max_length=100)
#     address = models.CharField(max_length=255)
#     service_community = models.CharField(max_length=100)
#     latitude = models.FloatField()
#     longitude = models.FloatField()
#     max_capacity = models.IntegerField()
#     indoor_capacity = models.IntegerField()
#     outdoor_capacity = models.IntegerField()
#     indoor_area = models.FloatField()
#     outdoor_area = models.FloatField()

#     class Meta:
#         managed = False
#         db_table = 'shelters_shelter'


# class SheltersShelterDisasterSupportTypes(models.Model):
#     shelter = models.ForeignKey(SheltersShelter, models.DO_NOTHING)
#     disastertype = models.ForeignKey(SheltersDisastertype, models.DO_NOTHING)

#     class Meta:
#         managed = False
#         db_table = 'shelters_shelter_disaster_support_types'
#         unique_together = (('shelter', 'disastertype'),)
