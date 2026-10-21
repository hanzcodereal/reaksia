export interface VipKey {
  name: string;
  apiKey: string;
  domain: string;
}

export interface VipCredential {
  email: string;
  uid: string;
}

export const VIP_CREDENTIALS: Record<string, VipCredential> = {
  'VIP-SYNOZG8C': {
    email: 'abovezephyrax@gmail.com',
    uid: 'syNOzg8C4dfMq8CwnE0inNDNdwn1'
  },
  'VIP-D68JICP0': {
    email: 'pribadiarep@gmail.com',
    uid: 'n6eaa7vLSWdexXeCzDnThjqxHps1'
  },
  'VIP-G3FA579P': {
    email: 'berrymodapk@gmail.com',
    uid: 'G3FA579Px5MLiC4zISunSqergX43'
  },
  'VIP-H9PQGDBA': {
    email: 'kenznan123@gmail.com',
    uid: 'h9PQgdbApBWe1E3p3ZXffnpWOdm1'
  },
  'VIP-VIP-D68J': {
    email: 'pribadiarep@gmail.com',
    uid: 'VIP-D68JICPO'
  }
};

export const DEFAULT_VIP_KEYS: VipKey[] = [
  {
    name: 'VIP-SYNOZG8C',
    apiKey:
      'BERRY-RCH-XLedTFORQjE0o05upBSBjMhFLyJzA+ZgINzUpnhbQal+Vl0TdTCWhEyR1i7aCFD97C9dPvs7ZAOTkljWouUmpDplbLNpaloI7ybxoXm95mT4To14487VOag=',
    domain: 'https://mytestdomain.com'
  },
  {
    name: 'VIP-G3FA579P',
    apiKey:
      'BERRY-RCH-s488dmV/Im9CYK9RksIKzHB+PKpqxaGBeDje9boybZoMiEoWLc1EmGG2TA9yTgBOCa9RT56a35exUMwqJG06QTO39LJvF7IWZCVq3FKzME50TUNgJH4=',
    domain: 'https://berrymodapk.com'
  },
  {
    name: 'VIP-VIP-D68J',
    apiKey:
      'BERRY-RCH-UF0CX6Lc+ncL7W/kQldo2v+uKbXtjyqhRg6z/u/GJaoL41jILpCerrfSFQBGLSZnNqHvFrIJ5bnOnDTd2K102CgMulKWZfxGbeo/Fmf9Pi4w2mySyBf5dLAnaw==',
    domain: 'https://reactv2.zfile.web.id'
  },
  {
    name: 'VIP-D68JICP0',
    apiKey:
      'BERRY-RCH-Eu3fhllDTNViiwl8dFcVKfMnJUzSt/UFLTftJ/sZJgPy/nCC3Y7JO+83gJLLhicfp+SEEhfruPHhIE3vJrr0oU5mhEfpa2GcBcC4A/GV9VaInumRoLsmSLjBskNQyVE=',
    domain: 'https://api.rech.v2.zfile.web.id'
  },
  {
    name: 'VIP-H9PQGDBA',
    apiKey:
      '5XJr5CoEvcwn6Akmx4TvQPV+ybnaa7VAn8OUYdociEXLS2l06kPypNMFhz5eMExSxrq+/mHz8sOu/5k44dEB016L/QJ3QZpPuYbDiSdpxlVTOR6a14P295M8lQrmMrj0YLJmmne1sQ+1YGhCKSg=',
    domain: 'https://anzzmodsofficial.edgeone.dev/reaction/wa'
  }
];
