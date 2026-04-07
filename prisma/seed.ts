/**
 * Prisma seed script — provisions a minimal template environment.
 * Run: npx prisma db seed
 *
 * Idempotent: uses upsert with fixed UUIDs so it can be run repeatedly.
 * Creates 1 org, permissions, 4 system roles, 1 Supabase Auth user,
 * 1 UserProfile, 2 departments, and Admin role assignment.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local for Supabase env vars (Prisma auto-loads prisma/.env for DATABASE_URL)
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PERMISSIONS, ROLE_DEFINITIONS } from '../src/lib/constants/permissions';

const prisma = new PrismaClient();

// ── Fixed UUIDs (idempotent re-runs) ──

const ORG_ID         = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID  = '00000000-0000-0000-0000-000000000010';
const DEPT_ENG_ID    = '00000000-0000-0000-0000-000000000020';
const DEPT_OPS_ID    = '00000000-0000-0000-0000-000000000021';

const ROLE_IDS: Record<string, string> = {
  Admin:       '00000000-0000-0000-0000-000000000030',
  Manager:     '00000000-0000-0000-0000-000000000031',
  Contributor: '00000000-0000-0000-0000-000000000032',
  Viewer:      '00000000-0000-0000-0000-000000000033',
};

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123!';
const SEED_DATE      = new Date('2025-01-01T00:00:00Z');

// ── Supabase Admin Client ──

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set in .env.local'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Helpers ──

function log(msg: string) {
  console.log(`  ✓ ${msg}`);
}

// ── Seed Functions ──

async function seedOrganization() {
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: 'Template Org', slug: 'template', plan: 'free' },
    create: {
      id: ORG_ID,
      name: 'Template Org',
      slug: 'template',
      plan: 'free',
      createdAt: SEED_DATE,
    },
  });
  log('Organization: Template Org');
}

async function seedSupabaseUser() {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.auth.admin.createUser({
    id: ADMIN_USER_ID,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Admin User' },
  });

  if (error) {
    if (
      error.message?.includes('already been registered') ||
      error.message?.includes('already exists')
    ) {
      await supabase.auth.admin.updateUserById(ADMIN_USER_ID, { password: ADMIN_PASSWORD });
      log(`Supabase Auth (exists, updated): ${ADMIN_EMAIL}`);
    } else {
      console.error(`  ✗ Failed to create ${ADMIN_EMAIL}:`, error.message);
    }
  } else {
    log(`Supabase Auth (created): ${ADMIN_EMAIL}`);
  }
}

async function seedUserProfile() {
  await prisma.userProfile.upsert({
    where: { id: ADMIN_USER_ID },
    update: { email: ADMIN_EMAIL, fullName: 'Admin User', isSuperAdmin: true },
    create: {
      id: ADMIN_USER_ID,
      email: ADMIN_EMAIL,
      fullName: 'Admin User',
      organizationId: ORG_ID,
      isSuperAdmin: true,
      createdAt: SEED_DATE,
    },
  });
  log('UserProfile: admin@example.com');
}

async function seedPermissions() {
  for (const p of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { groupName_name: { groupName: p.groupName, name: p.name } },
      update: {},
      create: { name: p.name, groupName: p.groupName },
    });
  }
  log(`Permissions: ${DEFAULT_PERMISSIONS.length}`);
}

async function seedRoles() {
  // Fetch all permissions from DB to resolve names → IDs
  const allDbPerms = await prisma.permission.findMany();

  for (const roleDef of ROLE_DEFINITIONS) {
    const roleId = ROLE_IDS[roleDef.name];
    if (!roleId) continue;

    await prisma.role.upsert({
      where: { id: roleId },
      update: { name: roleDef.name },
      create: {
        id: roleId,
        organizationId: ORG_ID,
        name: roleDef.name,
        isSystem: true,
        createdBy: ADMIN_USER_ID,
        createdAt: SEED_DATE,
      },
    });

    // Resolve permission IDs from "Group:Action" keys
    const permIds: string[] = [];
    for (const key of roleDef.permissions) {
      const [groupName, ...nameParts] = key.split(':');
      const name = nameParts.join(':');
      const dbPerm = allDbPerms.find(p => p.groupName === groupName && p.name === name);
      if (dbPerm) permIds.push(dbPerm.id);
    }

    // Recreate role permission linkages
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permIds.map(permissionId => ({ roleId, permissionId })),
      });
    }
  }
  log(`Roles: ${ROLE_DEFINITIONS.length} with permission linkages`);
}

async function seedDepartments() {
  const departments = [
    { id: DEPT_ENG_ID, name: 'Engineering' },
    { id: DEPT_OPS_ID, name: 'Operations' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name },
      create: {
        id: dept.id,
        organizationId: ORG_ID,
        name: dept.name,
        createdBy: ADMIN_USER_ID,
        createdAt: SEED_DATE,
      },
    });
  }
  log(`Departments: ${departments.length} (Engineering, Operations)`);
}

async function seedUserRole() {
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ADMIN_USER_ID, roleId: ROLE_IDS.Admin } },
    update: {},
    create: {
      organizationId: ORG_ID,
      userId: ADMIN_USER_ID,
      roleId: ROLE_IDS.Admin,
      createdBy: ADMIN_USER_ID,
      createdAt: SEED_DATE,
    },
  });
  log('User-role assignment: admin@example.com → Admin');
}

// ── Main ──

async function main() {
  console.log('\nSeeding DK-WebTemplate environment...\n');

  // Order matters: FK dependencies
  await seedOrganization();
  await seedSupabaseUser();
  await seedUserProfile();
  await seedPermissions();
  await seedRoles();
  await seedDepartments();
  await seedUserRole();

  console.log('\nSeed complete!\n');
  console.log('Admin account:');
  console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
