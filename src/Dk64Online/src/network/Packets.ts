import { Packet, UDPPacket } from 'modloader64_api/ModLoaderDefaultImpls';
import { KongData } from './Database';

export class SyncStorage extends Packet {
  kong: Buffer;
  game_flags: Buffer;
  constructor(lobby: string, kong: Buffer, game_flags: Buffer) {
    super('SyncStorage', 'Dk64Online', lobby, false);
    this.kong = kong;
    this.game_flags = game_flags;
  }
}

export class SyncKong extends Packet {
  kong: KongData;
  kong_index: number;
  constructor(lobby: string, kong: KongData, kong_index: number, persist: boolean) {
    super('SyncKong', 'Dk64Online', lobby, persist);
    this.kong = kong;
    this.kong_index = kong_index;
  }
}

export class SyncBuffered extends Packet {
  value: Buffer;
  constructor(lobby: string, header: string, value: Buffer, persist: boolean) {
    super(header, 'Dk64Online', lobby, persist);
    this.value = value;
  }
}

export class SyncNumbered extends Packet {
  value: number;
  constructor(lobby: string, header: string, value: number, persist: boolean) {
    super(header, 'Dk64Online', lobby, persist);
    this.value = value;
  }
}