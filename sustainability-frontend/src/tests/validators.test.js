import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword
} from '../utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('returns error when email is empty or whitespace', () => {
      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('   ')).toBe('Email is required');
      expect(validateEmail(null)).toBe('Email is required');
    });

    it('returns error on invalid email format', () => {
      expect(validateEmail('notanemail')).toBe('Invalid email format');
      expect(validateEmail('asha@vayu')).toBe('Invalid email format');
      expect(validateEmail('@vayu.test')).toBe('Invalid email format');
    });

    it('returns null for a valid email', () => {
      expect(validateEmail('asha@vayu.test')).toBeNull();
      expect(validateEmail('  asha@vayu.test  ')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('returns error when password is empty', () => {
      expect(validatePassword('')).toBe('Password is required');
      expect(validatePassword(null)).toBe('Password is required');
    });

    it('returns error when password is shorter than 8 characters', () => {
      expect(validatePassword('Ab12345')).toBe('Password must be at least 8 characters long');
    });

    it('returns error when password lacks a number or letter', () => {
      expect(validatePassword('OnlyLettersHere')).toBe('Password must contain at least one letter and one number');
      expect(validatePassword('12345678')).toBe('Password must contain at least one letter and one number');
    });

    it('returns null for a valid password', () => {
      expect(validatePassword('SecurePass1')).toBeNull();
    });
  });

  describe('validateName', () => {
    it('returns error when name is empty or whitespace', () => {
      expect(validateName('')).toBe('Name is required');
      expect(validateName('   ')).toBe('Name is required');
      expect(validateName(null)).toBe('Name is required');
    });

    it('returns null for a valid name', () => {
      expect(validateName('Asha Sharma')).toBeNull();
    });
  });

  describe('validateConfirmPassword', () => {
    it('returns error when confirmPassword is empty', () => {
      expect(validateConfirmPassword('SecurePass1', '')).toBe('Please confirm your password');
    });

    it('returns error when passwords do not match', () => {
      expect(validateConfirmPassword('SecurePass1', 'Different1')).toBe('Passwords do not match');
    });

    it('returns null when passwords match', () => {
      expect(validateConfirmPassword('SecurePass1', 'SecurePass1')).toBeNull();
    });
  });
});

