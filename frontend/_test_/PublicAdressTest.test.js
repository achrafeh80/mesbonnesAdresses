import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import MyAddressesScreen from "../screens/MyAddressesScreen";
import { getAuth } from "firebase/auth";
import { getDocs, query, collection, where } from "firebase/firestore";

// Mock des fonctions
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../utils/firebase", () => ({
  db: {},
}));

const mockNavigate = jest.fn();
const mockAddListener = jest.fn((event, callback) => {
  if (event === "focus") {
    setTimeout(callback, 0);
  }
  return jest.fn();
});

const navigation = {
  navigate: mockNavigate,
  addListener: mockAddListener,
};

describe("MyAddressesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le loader pendant le chargement", async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);

    getDocs.mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

    expect(getByText("Chargement…")).toBeTruthy();
  });

  it("affiche un message quand il n'y a pas d'adresses", async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);

    getDocs.mockResolvedValue({ docs: [] });

    const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

    await waitFor(() => {
      expect(getByText("Aucune adresse pour le moment.")).toBeTruthy();
    });
  });

  it("navigue vers CreateAddress quand on clique sur le bouton créer", async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);

    getDocs.mockResolvedValue({ docs: [] });

    const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

    await waitFor(() => {
      expect(getByText("+ Créer une adresse")).toBeTruthy();
    });

    const createButton = getByText("+ Créer une adresse");
    fireEvent.press(createButton);

    expect(mockNavigate).toHaveBeenCalledWith("CreateAddress");
  });

  it("navigue vers AddressDetail quand on clique sur une adresse", async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);

    getDocs.mockResolvedValue({
      docs: [
        {
          id: "address123",
          data: () => ({
            title: "Restaurant Test",
            description: "Description test",
            isPublic: true,
            images: [
              "https://tse4.mm.bing.net/th/id/OIP.O7qcUzX41GsAcFhJ9CUkXQHaDs?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
            ],
          }),
        },
      ],
    });

    const { getByText } = render(<MyAddressesScreen navigation={navigation} />);

    await waitFor(() => {
      expect(getByText("Restaurant Test")).toBeTruthy();
    });

    const addressCard = getByText("Restaurant Test");
    fireEvent.press(addressCard);

    expect(mockNavigate).toHaveBeenCalledWith("AddressDetail", {
      addressId: "address123",
    });
  });
});
