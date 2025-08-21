import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type UpsertProfileRequest = {
  email: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dietaryPreference?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'KETO' | 'PALEO' | 'MEDITERRANEAN' | 'CUSTOM';
  healthConditions?: string[];
  allergies?: string[];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email query param' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsertProfileRequest;
    if (!body.email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email: body.email },
      create: { email: body.email },
      update: {},
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        age: body.age ?? undefined,
        gender: body.gender ?? undefined,
        heightCm: body.heightCm ?? undefined,
        weightKg: body.weightKg ?? undefined,
        activityLevel: body.activityLevel ?? undefined,
        dietaryPreference: body.dietaryPreference ?? undefined,
        healthConditions: body.healthConditions ? (body.healthConditions as unknown as Prisma.InputJsonValue) : undefined,
        allergies: body.allergies ? (body.allergies as unknown as Prisma.InputJsonValue) : undefined,
      },
      create: {
        userId: user.id,
        age: body.age ?? null,
        gender: body.gender ?? null,
        heightCm: body.heightCm ?? null,
        weightKg: body.weightKg ?? null,
        activityLevel: body.activityLevel ?? 'SEDENTARY',
        dietaryPreference: body.dietaryPreference ?? 'CUSTOM',
        healthConditions: body.healthConditions ? (body.healthConditions as unknown as Prisma.InputJsonValue) : undefined,
        allergies: body.allergies ? (body.allergies as unknown as Prisma.InputJsonValue) : undefined,
      },
    });

    return new Response(JSON.stringify({ user, profile }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Failed to upsert profile' }), { status: 500 });
  }
}

