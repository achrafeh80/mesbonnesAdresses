import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('navigue vers l\'écran Signup quand on clique sur "Créer un compte"', () => {
    const { getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    const signupLink = getByText('Créer un compte');
    fireEvent.press(signupLink);

    expect(mockNavigate).toHaveBeenCalledWith('Signup');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('se connecte avec succès avec des identifiants valides', async () => {
    const mockAuth = { currentUser: null };
    getAuth.mockReturnValue(mockAuth);
    signInWithEmailAndPassword.mockResolvedValue({ 
      user: { uid: 'test-uid', email: 'test@example.com' } 
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
        mockAuth,
        'test@example.com',
        'password123'
      );
    });

    expect(queryByText('Identifiants invalides ou compte introuvable.')).toBeNull();
  });

  it('affiche un message d\'erreur quand la connexion échoue', async () => {
    const mockAuth = { currentUser: null };
    getAuth.mockReturnValue(mockAuth);
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

  it('ne fait rien si les champs sont vides', async () => {
    const mockAuth = { currentUser: null };
    getAuth.mockReturnValue(mockAuth);
    signInWithEmailAndPassword.mockResolvedValue({ 
      user: { uid: 'test-uid' } 
    });

    const { getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        '',
        ''
      );
    });
  });
});