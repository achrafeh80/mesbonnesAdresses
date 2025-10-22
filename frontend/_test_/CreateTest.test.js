import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateAddressScreen from '../screens/CreateAddressScreen';
import { getAuth } from 'firebase/auth';
import { addDoc } from 'firebase/firestore';
import * as Location from 'expo-location';

// Mock des fonctions 
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
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

jest.mock('../utils/firebase', () => ({
  db: {},
  storage: {},
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

const mockGoBack = jest.fn();
const navigation = {
  goBack: mockGoBack,
};

global.fetch = jest.fn();
global.alert = jest.fn();

describe('CreateAddressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('met à jour les champs titre et description', () => {
    const mockAuth = { currentUser: { uid: 'user123', email: 'test@example.com' } };
    getAuth.mockReturnValue(mockAuth);

    const { getByPlaceholderText } = render(
      <CreateAddressScreen navigation={navigation} />
    );

    const titleInput = getByPlaceholderText("Titre de l'adresse");
    const descriptionInput = getByPlaceholderText('Description (facultative)');

    fireEvent.changeText(titleInput, 'Mon Restaurant');
    fireEvent.changeText(descriptionInput, 'Super endroit pour manger');

    expect(titleInput.props.value).toBe('Mon Restaurant');
    expect(descriptionInput.props.value).toBe('Super endroit pour manger');
  });

  it('bascule le switch entre privé et public', () => {
    const mockAuth = { currentUser: { uid: 'user123', email: 'test@example.com' } };
    getAuth.mockReturnValue(mockAuth);

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

  it('affiche une alerte si le titre est vide lors de la création', async () => {
    const mockAuth = { currentUser: { uid: 'user123', email: 'test@example.com' } };
    getAuth.mockReturnValue(mockAuth);

    const { getByText } = render(
      <CreateAddressScreen navigation={navigation} />
    );

    const createButton = getByText("Créer l'adresse");
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Titre requis');
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('affiche une alerte si la localisation est manquante', async () => {
    const mockAuth = { currentUser: { uid: 'user123', email: 'test@example.com' } };
    getAuth.mockReturnValue(mockAuth);

    const { getByPlaceholderText, getByText } = render(
      <CreateAddressScreen navigation={navigation} />
    );

    const titleInput = getByPlaceholderText("Titre de l'adresse");
    fireEvent.changeText(titleInput, 'Mon Restaurant');

    const createButton = getByText("Créer l'adresse");
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Choisissez une localisation');
    });

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('crée une adresse avec succès et retourne en arrière', async () => {
    const mockAuth = { 
      currentUser: { 
        uid: 'user123', 
        email: 'test@example.com',
        displayName: 'Test User'
      } 
    };
    getAuth.mockReturnValue(mockAuth);
    addDoc.mockResolvedValue({ id: 'newAddressId' });

    const { getByPlaceholderText, getByText, getByRole } = render(
      <CreateAddressScreen navigation={navigation} />
    );

    const titleInput = getByPlaceholderText("Titre de l'adresse");
    fireEvent.changeText(titleInput, 'Mon Restaurant');

    const descriptionInput = getByPlaceholderText('Description (facultative)');
    fireEvent.changeText(descriptionInput, 'Excellent restaurant');

    const switchElement = getByRole('switch');
    fireEvent(switchElement, 'valueChange', true);

    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 48.8566, longitude: 2.3522 },
    });

    const locationButton = getByText('Utiliser ma position actuelle');
    fireEvent.press(locationButton);

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });

    const createButton = getByText("Créer l'adresse");
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        'mockCollection',
        expect.objectContaining({
          title: 'Mon Restaurant',
          description: 'Excellent restaurant',
          isPublic: true,
          location: { latitude: 48.8566, longitude: 2.3522 },
          ownerUid: 'user123',
          ownerName: 'Test User',
          images: [],
          createdAt: { seconds: 1234567890 },
        })
      );
    });

    expect(mockGoBack).toHaveBeenCalled();
  });
});