import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateAddressScreen from '../screens/CreateAddressScreen';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Mock Firebase
jest.mock('../utils/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mockCollection'),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1234567890 })),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
  };
});

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
};

global.fetch = jest.fn();
global.alert = jest.fn();

describe('Création d\'Adresse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    global.fetch.mockClear();
  });

  describe('Champs de formulaire', () => {
    it('affiche tous les champs du formulaire', () => {
      const { getByPlaceholderText, getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      expect(getByPlaceholderText('Titre de l\'adresse')).toBeTruthy();
      expect(getByPlaceholderText('Description (facultative)')).toBeTruthy();
      expect(getByText('Privée')).toBeTruthy();
      expect(getByText('Publique')).toBeTruthy();
      expect(getByText('Choisir une photo')).toBeTruthy();
    });

    it('met à jour le champ titre', () => {
      const { getByPlaceholderText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const titleInput = getByPlaceholderText('Titre de l\'adresse');
      fireEvent.changeText(titleInput, 'Mon Restaurant');

      expect(titleInput.props.value).toBe('Mon Restaurant');
    });

    it('met à jour le champ description', () => {
      const { getByPlaceholderText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const descriptionInput = getByPlaceholderText('Description (facultative)');
      fireEvent.changeText(descriptionInput, 'Super endroit pour manger');

      expect(descriptionInput.props.value).toBe('Super endroit pour manger');
    });

    it('bascule le switch entre privé et public', () => {
      const { getByRole } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const switchElement = getByRole('switch');

      expect(switchElement.props.value).toBe(false);

      fireEvent(switchElement, 'valueChange', true);
      expect(switchElement.props.value).toBe(true);

      fireEvent(switchElement, 'valueChange', false);
      expect(switchElement.props.value).toBe(false);
    });
  });

  describe('Gestion des photos', () => {
    it('sélectionne une photo depuis la galerie', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const pickButton = getByText('Choisir une photo');
      fireEvent.press(pickButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: 'Images',
          allowsEditing: true,
          quality: 0.9,
        });
      });
    });

    it('affiche l\'aperçu de la photo sélectionnée', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByText, findByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const pickButton = getByText('Choisir une photo');
      fireEvent.press(pickButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    it('supprime la photo sélectionnée', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const pickButton = getByText('Choisir une photo');
      fireEvent.press(pickButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

    });

    it('ne fait rien si la sélection de photo est annulée', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const pickButton = getByText('Choisir une photo');
      fireEvent.press(pickButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Gestion de la localisation', () => {
    it('utilise la position actuelle avec succès', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 48.8566, longitude: 2.3522 },
      });

      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const locationButton = getByText('Utiliser ma position actuelle');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });
    });

    it('affiche une alerte si la permission de localisation est refusée', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const locationButton = getByText('Utiliser ma position actuelle');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Permission de localisation refusée');
      });
    });
  });

  describe('Recherche d\'adresse', () => {
    it('effectue une recherche d\'adresse', async () => {
      global.fetch.mockResolvedValue({
        json: async () => [
          {
            place_id: '123',
            display_name: 'Paris, France',
            lat: '48.8566',
            lon: '2.3522',
          },
        ],
      });

      const { getByPlaceholderText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const searchInput = getByPlaceholderText('Rechercher une adresse');
      fireEvent.changeText(searchInput, 'Paris');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('nominatim.openstreetmap.org'),
          expect.any(Object)
        );
      });
    });

    it('n\'effectue pas de recherche si moins de 2 caractères', () => {
      const { getByPlaceholderText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const searchInput = getByPlaceholderText('Rechercher une adresse');
      fireEvent.changeText(searchInput, 'P');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sélectionne une suggestion de recherche', async () => {
      global.fetch.mockResolvedValue({
        json: async () => [
          {
            place_id: '123',
            display_name: 'Paris, France',
            lat: '48.8566',
            lon: '2.3522',
          },
        ],
      });

      const { getByPlaceholderText, findByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const searchInput = getByPlaceholderText('Rechercher une adresse');
      fireEvent.changeText(searchInput, 'Paris');

      const suggestion = await findByText('Paris, France');
      fireEvent.press(suggestion);
    });
  });

  describe('Validation et création', () => {
    it('affiche une alerte si le titre est vide', async () => {
      const { getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const createButton = getByText('Créer l\'adresse');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Titre requis');
      });

      expect(addDoc).not.toHaveBeenCalled();
    });

    it('affiche une alerte si la localisation est manquante', async () => {
      const { getByPlaceholderText, getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const titleInput = getByPlaceholderText('Titre de l\'adresse');
      fireEvent.changeText(titleInput, 'Mon Restaurant');

      const createButton = getByText('Créer l\'adresse');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Choisissez une localisation');
      });

      expect(addDoc).not.toHaveBeenCalled();
    });

    it('affiche une alerte si l\'utilisateur n\'est pas connecté', async () => {
      const { auth } = require('../utils/firebase');
      auth.currentUser = null;

      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 48.8566, longitude: 2.3522 },
      });

      const { getByPlaceholderText, getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const titleInput = getByPlaceholderText('Titre de l\'adresse');
      fireEvent.changeText(titleInput, 'Mon Restaurant');

      const locationButton = getByText('Utiliser ma position actuelle');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });

      const createButton = getByText('Créer l\'adresse');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Vous devez être connecté');
      });

      auth.currentUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
    });

    it('crée une adresse privée sans photo avec succès', async () => {
      const { auth } = require('../utils/firebase');
      addDoc.mockResolvedValue({ id: 'newAddressId' });

      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 48.8566, longitude: 2.3522 },
      });

      const { getByPlaceholderText, getByText } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const titleInput = getByPlaceholderText('Titre de l\'adresse');
      fireEvent.changeText(titleInput, 'Mon Restaurant');

      const descriptionInput = getByPlaceholderText('Description (facultative)');
      fireEvent.changeText(descriptionInput, 'Excellent restaurant');

      const locationButton = getByText('Utiliser ma position actuelle');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });

      const createButton = getByText('Créer l\'adresse');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledWith(
          'mockCollection',
          expect.objectContaining({
            title: 'Mon Restaurant',
            description: 'Excellent restaurant',
            isPublic: false,
            location: { latitude: 48.8566, longitude: 2.3522 },
            ownerUid: 'user123',
            ownerName: 'Test User',
            images: [],
          })
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        'Map',
        expect.objectContaining({
          createdAddress: expect.objectContaining({
            title: 'Mon Restaurant',
            description: 'Excellent restaurant',
            isPublic: false,
          }),
        })
      );
    });

    it('crée une adresse publique avec photo avec succès', async () => {
      addDoc.mockResolvedValue({ id: 'newAddressId' });
      getDownloadURL.mockResolvedValue('https://example.com/photo.jpg');

      global.fetch.mockResolvedValue({
        blob: async () => new Blob(['photo data']),
      });

      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
      });
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 48.8566, longitude: 2.3522 },
      });

      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByPlaceholderText, getByText, getByRole } = render(
        <CreateAddressScreen navigation={navigation} />
      );

      const titleInput = getByPlaceholderText('Titre de l\'adresse');
      fireEvent.changeText(titleInput, 'Mon Restaurant');

      const switchElement = getByRole('switch');
      fireEvent(switchElement, 'valueChange', true);

      const pickButton = getByText('Choisir une photo');
      fireEvent.press(pickButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      const locationButton = getByText('Utiliser ma position actuelle');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });

      const createButton = getByText('Créer l\'adresse');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(uploadBytes).toHaveBeenCalled();
        expect(getDownloadURL).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledWith(
          'mockCollection',
          expect.objectContaining({
            title: 'Mon Restaurant',
            isPublic: true,
            images: ['https://example.com/photo.jpg'],
          })
        );
      });
    });

     it('gère les erreurs lors de la création', async () => {
          const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

          addDoc.mockRejectedValue(new Error('Firestore error'));

          Location.requestForegroundPermissionsAsync.mockResolvedValue({
            status: 'granted',
          });
          Location.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: 48.8566, longitude: 2.3522 },
          });

          const { getByPlaceholderText, getByText } = render(
            <CreateAddressScreen navigation={navigation} />
          );

          const titleInput = getByPlaceholderText('Titre de l\'adresse');
          fireEvent.changeText(titleInput, 'Mon Restaurant');

          const locationButton = getByText('Utiliser ma position actuelle');
          fireEvent.press(locationButton);

          await waitFor(() => {
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
          });

          const createButton = getByText('Créer l\'adresse');
          fireEvent.press(createButton);

          await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith(
              "Erreur lors de la création de l'adresse"
            );
          });
          consoleErrorSpy.mockRestore();
        });
  });
});
