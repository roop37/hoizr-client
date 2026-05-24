export type IndianCityMaster = {
  _id: string;
  value: string;
  cityId?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type GenreTagMaster = {
  _id: string;
  value: string;
};
