export class Database {
  kong: any = {};

  game_flags: Buffer = Buffer.alloc(0x013B);

  constructor() {
    let i: number;
    for (i = 0; i < 6; i++)
      this.kong[i] = new KongData();
  }
}
    
export class DatabaseClient extends Database {}
    
export class DatabaseServer extends Database {}

export class KongData {
  colored_banana: Buffer = Buffer.alloc(0x1C);
  troff_scoff_banana: Buffer = Buffer.alloc(0x1C);
  golden_banana: Buffer = Buffer.alloc(0x1C);
  moves: number = 0;
  simian_slam: number = 0;
  weapon: number = 0;
  ammo_belt: number = 0;
  instrument: number = 0;
  coins: number = 0;
  instrument_energy: number = 0;
}