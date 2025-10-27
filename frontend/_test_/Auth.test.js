import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Mock Firebase
jest.mock('../utils/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

describe('Authentification - Login & Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('📱 LoginScreen', () => {
    it('affiche correctement les champs email et mot de passe', () => {
      const { getByPlaceholderText } = render(<LoginScreen navigation={navigation} />);

      expect(getByPlaceholderText('ex: jean.dupont@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
    });

    it('bascule la visibilité du mot de passe', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={navigation} />
      );

      const passwordInput = getByPlaceholderText('••••••••');
      const toggleButton = getByText('Voir');

      expect(passwordInput.props.secureTextEntry).toBe(true);

      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(getByText('Masquer')).toBeTruthy();

      fireEvent.press(getByText('Masquer'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('navigue vers l\'écran Signup', () => {
      const { getByText } = render(<LoginScreen navigation={navigation} />);

      const signupLink = getByText('Créer un compte');
      fireEvent.press(signupLink);

      expect(mockNavigate).toHaveBeenCalledWith('Signup');
    });

    it('se connecte avec succès avec des identifiants valides', async () => {
      const { auth } = require('../utils/firebase');
      
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' },
      });

      const { getByPlaceholderText, getByText, queryByText } = render(
        <LoginScreen navigation={navigation} />
      );

      const emailInput = getByPlaceholderText('ex: jean.dupont@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const loginButton = getByText('Se connecter');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        );
      });

      expect(queryByText('Identifiants invalides ou compte introuvable.')).toBeNull();
    });

    it('affiche un message d\'erreur quand la connexion échoue', async () => {
      signInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/invalid-credential')
      );

      const { getByPlaceholderText, getByText, findByText } = render(
        <LoginScreen navigation={navigation} />
      );

      const emailInput = getByPlaceholderText('ex: jean.dupont@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const loginButton = getByText('Se connecter');

      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      const errorMessage = await findByText('Identifiants invalides ou compte introuvable.');
      expect(errorMessage).toBeTruthy();
    });

    it('permet de se connecter même avec des champs vides', async () => {
      const { auth } = require('../utils/firebase');

      signInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/invalid-email')
      );

      const { getByText } = render(<LoginScreen navigation={navigation} />);

      const loginButton = getByText('Se connecter');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, '', '');
      });
    });
  });

  describe('SignupScreen', () => {
    it('affiche correctement tous les champs', () => {
      const { getByPlaceholderText } = render(<SignupScreen navigation={navigation} />);

      expect(getByPlaceholderText('ex: Jean Dupont')).toBeTruthy();
      expect(getByPlaceholderText('ex: jean.dupont@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
    });

    it('bascule la visibilité du mot de passe', () => {
      const { getByText, getByPlaceholderText } = render(
        <SignupScreen navigation={navigation} />
      );

      const passwordInput = getByPlaceholderText('••••••••');
      const toggleButton = getByText('Voir');

      expect(passwordInput.props.secureTextEntry).toBe(true);

      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      fireEvent.press(getByText('Masquer'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('navigue vers l\'écran Login', () => {
      const { getByText } = render(<SignupScreen navigation={navigation} />);

      const loginLink = getByText('Se connecter');
      fireEvent.press(loginLink);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('crée un compte avec succès', async () => {
      const { auth } = require('../utils/firebase');
      const mockUser = { uid: 'new-user-id', email: 'newuser@example.com' };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      updateProfile.mockResolvedValue();

      const { getByPlaceholderText, getByText } = render(
        <SignupScreen navigation={navigation} />
      );

      fireEvent.changeText(
        getByPlaceholderText('ex: Jean Dupont'),
        'Jean Dupont'
      );
      fireEvent.changeText(
        getByPlaceholderText('ex: jean.dupont@email.com'),
        'newuser@example.com'
      );
      fireEvent.changeText(
        getByPlaceholderText('••••••••'),
        'securePassword123'
      );

      const signupButton = getByText('S\'inscrire');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'newuser@example.com',
          'securePassword123'
        );
      });

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith(mockUser, {
          displayName: 'Jean Dupont',
        });
      });
    });

    it('crée un compte sans nom d\'utilisateur', async () => {
      const { auth } = require('../utils/firebase');
      const mockUser = { uid: 'new-user-id', email: 'test@example.com' };

      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const { getByPlaceholderText, getByText } = render(
        <SignupScreen navigation={navigation} />
      );

      fireEvent.changeText(
        getByPlaceholderText('ex: jean.dupont@email.com'),
        'test@example.com'
      );
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');

      const signupButton = getByText('S\'inscrire');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });

      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('affiche un message d\'erreur quand l\'inscription échoue', async () => {
      createUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/email-already-in-use')
      );

      const { getByPlaceholderText, getByText, findByText } = render(
        <SignupScreen navigation={navigation} />
      );

      fireEvent.changeText(
        getByPlaceholderText('ex: jean.dupont@email.com'),
        'existing@example.com'
      );
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');

      const signupButton = getByText('S\'inscrire');
      fireEvent.press(signupButton);

      const errorMessage = await findByText(
        "Impossible de créer le compte. Vérifie l'email et le mot de passe."
      );
      expect(errorMessage).toBeTruthy();
    });

    it('affiche le hint pour le mot de passe', () => {
      const { getByText } = render(<SignupScreen navigation={navigation} />);
      
      expect(getByText('Minimum 6 caractères.')).toBeTruthy();
    });
  });
});
