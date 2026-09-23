// src/constants/nigeriaLocations.ts
// Nigerian states with their capital city and a few well-known local areas.
// Extend as needed — the picker only requires `name` + `capital`.

export type State = {
  name: string;
  capital: string;
  areas: string[];
};

export const nigeriaStates: State[] = [
  { name: 'Abia', capital: 'Umuahia', areas: ['Aba', 'Umuahia', 'Ohafia'] },
  { name: 'Adamawa', capital: 'Yola', areas: ['Yola', 'Mubi', 'Numan'] },
  { name: 'Akwa Ibom', capital: 'Uyo', areas: ['Uyo', 'Eket', 'Ikot Ekpene'] },
  { name: 'Anambra', capital: 'Awka', areas: ['Awka', 'Onitsha', 'Nnewi'] },
  { name: 'Bauchi', capital: 'Bauchi', areas: ['Bauchi', 'Azare', 'Misau'] },
  { name: 'Bayelsa', capital: 'Yenagoa', areas: ['Yenagoa', 'Brass', 'Sagbama'] },
  { name: 'Benue', capital: 'Makurdi', areas: ['Makurdi', 'Gboko', 'Otukpo'] },
  { name: 'Borno', capital: 'Maiduguri', areas: ['Maiduguri', 'Biu', 'Bama'] },
  { name: 'Cross River', capital: 'Calabar', areas: ['Calabar', 'Ugep', 'Ogoja'] },
  { name: 'Delta', capital: 'Asaba', areas: ['Asaba', 'Warri', 'Sapele'] },
  { name: 'Ebonyi', capital: 'Abakaliki', areas: ['Abakaliki', 'Afikpo', 'Onueke'] },
  { name: 'Edo', capital: 'Benin City', areas: ['Benin City', 'Auchi', 'Ekpoma'] },
  { name: 'Ekiti', capital: 'Ado-Ekiti', areas: ['Ado-Ekiti', 'Ikere', 'Ijesha Isu'] },
  { name: 'Enugu', capital: 'Enugu', areas: ['Enugu', 'Nsukka', 'Oji River'] },
  { name: 'FCT', capital: 'Abuja', areas: ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari'] },
  { name: 'Gombe', capital: 'Gombe', areas: ['Gombe', 'Kaltungo', 'Billiri'] },
  { name: 'Imo', capital: 'Owerri', areas: ['Owerri', 'Orlu', 'Okigwe'] },
  { name: 'Jigawa', capital: 'Dutse', areas: ['Dutse', 'Hadejia', 'Gumel'] },
  { name: 'Kaduna', capital: 'Kaduna', areas: ['Kaduna', 'Zaria', 'Kafanchan'] },
  { name: 'Kano', capital: 'Kano', areas: ['Kano', 'Wudil', 'Gwarzo'] },
  { name: 'Katsina', capital: 'Katsina', areas: ['Katsina', 'Daura', 'Funtua'] },
  { name: 'Kebbi', capital: 'Birnin Kebbi', areas: ['Birnin Kebbi', 'Argungu', 'Yauri'] },
  { name: 'Kogi', capital: 'Lokoja', areas: ['Lokoja', 'Okene', 'Idah', 'Anyigba'] },
  { name: 'Kwara', capital: 'Ilorin', areas: ['Ilorin', 'Offa', 'Kaiama'] },
  { name: 'Lagos', capital: 'Ikeja', areas: ['Ikeja', 'Lekki', 'Yaba', 'Surulere', 'Victoria Island'] },
  { name: 'Nasarawa', capital: 'Lafia', areas: ['Lafia', 'Keffi', 'Akwanga'] },
  { name: 'Niger', capital: 'Minna', areas: ['Minna', 'Bida', 'Suleja'] },
  { name: 'Ogun', capital: 'Abeokuta', areas: ['Abeokuta', 'Sagamu', 'Ijebu Ode'] },
  { name: 'Ondo', capital: 'Akure', areas: ['Akure', 'Ondo', 'Owo'] },
  { name: 'Osun', capital: 'Osogbo', areas: ['Osogbo', 'Ile-Ife', 'Ilesa'] },
  { name: 'Oyo', capital: 'Ibadan', areas: ['Ibadan', 'Ogbomoso', 'Oyo'] },
  { name: 'Plateau', capital: 'Jos', areas: ['Jos', 'Bukuru', 'Pankshin'] },
  { name: 'Rivers', capital: 'Port Harcourt', areas: ['Port Harcourt', 'Bonny', 'Eleme'] },
  { name: 'Sokoto', capital: 'Sokoto', areas: ['Sokoto', 'Tambuwal', 'Illela'] },
  { name: 'Taraba', capital: 'Jalingo', areas: ['Jalingo', 'Wukari', 'Bali'] },
  { name: 'Yobe', capital: 'Damaturu', areas: ['Damaturu', 'Potiskum', 'Gashua'] },
  { name: 'Zamfara', capital: 'Gusau', areas: ['Gusau', 'Kaura Namoda', 'Talata Mafara'] },
];