import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyAddressesScreen from '../screens/MyAddressesScreen';
import PublicAddressesScreen from '../screens/PublicAddressesScreen';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('../utils/firebase', () => ({
  auth: {
    currentUser: { uid: 'user123', email: 'test@example.com' },
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockAddListener = jest.fn((event, callback) => {
  if (event === 'focus') {
    setTimeout(callback, 0);
  }
  return jest.fn();
});

const navigation = {
  navigate: mockNavigate,
  addListener: mockAddListener,
};

describe('Gestion des Adresses - Privées & Publiques', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockReturnValue({});
    where.mockImplementation((...args) => args);
    query.mockImplementation((...args) => args);
  });

  describe('Mes adresses', () => {
    it('affiche le loader pendant le chargement', () => {
      getDocs.mockImplementation(() => new Promise(() => {}));

      const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

      expect(getByText('Chargement…')).toBeTruthy();
    });

    it('affiche le bouton "Créer une adresse"', async () => {
      getDocs.mockResolvedValue({ docs: [] });

      const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getByText('+ Créer une adresse')).toBeTruthy();
      });
    });

    it('navigue vers CreateAddress quand on clique sur le bouton créer', async () => {
      getDocs.mockResolvedValue({ docs: [] });

      const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getByText('+ Créer une adresse')).toBeTruthy();
      });

      const createButton = getByText('+ Créer une adresse');
      fireEvent.press(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('CreateAddress');
    });

    it('affiche la liste des adresses après le chargement', async () => {
      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Restaurant Paris',
            description: 'Super resto',
            isPublic: true,
            averageRating: 4.5,
            ratingsCount: 10,
            images: ['https://example.com/image1.jpg'],
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Café Lyon',
            description: 'Bon café',
            isPublic: false,
            averageRating: 3.8,
            ratingsCount: 5,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { findByText } = render(<MyAddressesScreen navigation={navigation} />);

      expect(await findByText('Restaurant Paris')).toBeTruthy();
      expect(await findByText('Café Lyon')).toBeTruthy();
      expect(await findByText('Super resto')).toBeTruthy();
      expect(await findByText('Publique')).toBeTruthy();
      expect(await findByText('Privée')).toBeTruthy();
    });

    it('affiche "Aucune image" pour les adresses sans photo', async () => {
      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Sans Image',
            description: 'Test',
            isPublic: true,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { findByText } = render(<MyAddressesScreen navigation={navigation} />);

      expect(await findByText('Aucune image')).toBeTruthy();
    });

    it('affiche les notes et évaluations correctement', async () => {
      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Avec Note',
            isPublic: true,
            averageRating: 4.7,
            ratingsCount: 15,
            images: [],
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Sans Note',
            isPublic: false,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { findByText } = render(<MyAddressesScreen navigation={navigation} />);

      expect(await findByText('4.7 / 5 · 15')).toBeTruthy();
      expect(await findByText('Pas de note')).toBeTruthy();
    });

    it('navigue vers AddressDetail quand on clique sur une adresse', async () => {
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'address123',
            data: () => ({
              title: 'Restaurant Test',
              description: 'Description test',
              isPublic: true,
              images: ['https://example.com/image.jpg'],
            }),
          },
        ],
      });

      const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getByText('Restaurant Test')).toBeTruthy();
      });

      const addressCard = getByText('Restaurant Test');
      fireEvent.press(addressCard);

      expect(mockNavigate).toHaveBeenCalledWith('AddressDetail', {
        addressId: 'address123',
      });
    });

    it('recharge les adresses quand l\'écran reçoit le focus', async () => {
      getDocs.mockResolvedValue({ docs: [] });

      render(<MyAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });

      expect(mockAddListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });
  });

  describe('Adresses publiques', () => {
    it('affiche le loader pendant le chargement', () => {
      getDocs.mockImplementation(() => new Promise(() => {}));

      const { getByText } = render(<PublicAddressesScreen navigation={navigation} />);

      expect(getByText('Chargement…')).toBeTruthy();
    });

    it('affiche la liste des adresses publiques', async () => {
      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Restaurant Public',
            ownerName: 'Jean Dupont',
            ownerUid: 'other-user',
            isPublic: true,
            averageRating: 4.5,
            ratingsCount: 10,
            images: ['https://example.com/image1.jpg'],
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Café Public',
            ownerName: 'Marie Martin',
            ownerUid: 'another-user',
            isPublic: true,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { findByText } = render(<PublicAddressesScreen navigation={navigation} />);

      expect(await findByText('Restaurant Public')).toBeTruthy();
      expect(await findByText('Café Public')).toBeTruthy();
      expect(await findByText('par Jean Dupont')).toBeTruthy();
      expect(await findByText('par Marie Martin')).toBeTruthy();
    });

    it('filtre les adresses de l\'utilisateur actuel', async () => {
      const { auth } = require('../utils/firebase');
      auth.currentUser = { uid: 'user123' };

      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Mon Adresse Publique',
            ownerUid: 'user123',
            isPublic: true,
            images: [],
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Adresse d\'un Autre',
            ownerUid: 'other-user',
            isPublic: true,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { findByText, queryByText } = render(
        <PublicAddressesScreen navigation={navigation} />
      );

      expect(await findByText('Adresse d\'un Autre')).toBeTruthy();

      expect(queryByText('Mon Adresse Publique')).toBeNull();
    });

    it('affiche le badge "Publique" pour toutes les adresses', async () => {
      const mockAddresses = [
        {
          id: '1',
          data: () => ({
            title: 'Adresse 1',
            ownerUid: 'other-user',
            isPublic: true,
            images: [],
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Adresse 2',
            ownerUid: 'another-user',
            isPublic: true,
            images: [],
          }),
        },
      ];

      getDocs.mockResolvedValue({ docs: mockAddresses });

      const { getAllByText } = render(<PublicAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        const publicBadges = getAllByText('Publique');
        expect(publicBadges.length).toBeGreaterThan(0);
      });
    });

    it('navigue vers AddressDetail quand on clique sur une adresse', async () => {
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 'public123',
            data: () => ({
              title: 'Restaurant Public Test',
              ownerName: 'Test User',
              ownerUid: 'other-user',
              isPublic: true,
              images: [],
            }),
          },
        ],
      });

      const { getByText } = render(<PublicAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getByText('Restaurant Public Test')).toBeTruthy();
      });

      const addressCard = getByText('Restaurant Public Test');
      fireEvent.press(addressCard);

      expect(mockNavigate).toHaveBeenCalledWith('AddressDetail', {
        addressId: 'public123',
      });
    });

    it('recharge les adresses quand l\'écran reçoit le focus', async () => {
      getDocs.mockResolvedValue({ docs: [] });

      render(<PublicAddressesScreen navigation={navigation} />);

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });

      expect(mockAddListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });
  });
});
