export interface List {
  id: number;
  user_id: number;
  name: string;
  created_at: Date;
}

export interface ListItem {
  id: number;
  list_id: number;
  text: string;
  done: boolean;
  created_at: Date;
}
