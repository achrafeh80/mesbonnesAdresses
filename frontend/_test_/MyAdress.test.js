import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { collection, query, where } from "firebase/firestore";
import MyAddressesScreen from "../screens/MyAddressesScreen";
import { getAuth } from "firebase/auth";
import { getDocs } from "firebase/firestore";

// mock des fonctions
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

    collection.mockReturnValue({});
    where.mockImplementation((...args) => args);
    query.mockImplementation((...args) => args);
  });

  it('affiche le badge "Moi" pour toutes les adresses de l\'utilisateur', async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);
    const mockAddresses = [
      {
        id: "1",
        data: () => ({
          title: "Mon Restaurant",
          description: "Super resto",
          isPublic: true,
          averageRating: 4.5,
          ratingsCount: 10,
          images: [],
        }),
      },
      {
        id: "2",
        data: () => ({
          title: "Mon Café",
          description: "Bon café",
          isPublic: false,
          images: [],
        }),
      },
    ];

    getDocs.mockResolvedValue({ docs: mockAddresses });

    const { getAllByText, getByText } = render(
      <MyAddressesScreen navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByText("Mon Restaurant")).toBeTruthy();
    });

    const moiBadges = getAllByText("Moi");
    expect(moiBadges).toHaveLength(2);
  });

  it("affiche la liste des adresses après le chargement", async () => {
    const mockAuth = { currentUser: { uid: "user123" } };
    getAuth.mockReturnValue(mockAuth);

    const mockAddressesWithImage = [
      {
        id: "1",
        data: () => ({
          title: "Restaurant Paris",
          description: "Super resto",
          isPublic: true,
          averageRating: 4.5,
          ratingsCount: 10,
          images: [
            "https://miro.medium.com/v2/resize:fit:796/1*VxBKV4bcUJ4M7WCuCNmHWw.png",
          ],
        }),
      },
      {
        id: "2",
        data: () => ({
          title: "Café Lyon",
          description: "Bon café",
          isPublic: false,
          averageRating: 3.8,
          ratingsCount: 5,
          images: [],
        }),
      },
    ];

    getDocs.mockResolvedValue({ docs: mockAddressesWithImage });

    const { findByText } = render(
      <MyAddressesScreen navigation={navigation} />
    );

    expect(await findByText("Restaurant Paris")).toBeTruthy();
    expect(await findByText("Café Lyon")).toBeTruthy();
    expect(await findByText("Super resto")).toBeTruthy();
    expect(await findByText("Publique")).toBeTruthy();
    expect(await findByText("Privée")).toBeTruthy();
  }, 10000);

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

    const mockAddresses = [];

    getDocs.mockResolvedValue({
      docs: [
        {
          id: "address123",
          data: () => ({
            title: "Restaurant Test",
            description: "Description test",
            isPublic: true,
            images: [
              "https://www.simplilearn.com/ice9/free_resources_article_thumb/React_Native_Tutorial.jpg",
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
