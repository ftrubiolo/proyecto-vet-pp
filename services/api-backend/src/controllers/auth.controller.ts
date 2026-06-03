import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, roles, veterinarios, propietarios } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const registrarVeterinario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
};

export const registrarPropietario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
};

export const login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
};