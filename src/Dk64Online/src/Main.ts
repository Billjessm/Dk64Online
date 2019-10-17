import {
  EventsClient,
  EventServerJoined,
  EventServerLeft,
  EventHandler,
  EventsServer,
} from 'modloader64_api/EventHandler';
import { IModLoaderAPI, IPlugin } from 'modloader64_api/IModLoaderAPI';
import {
  ILobbyStorage,
  INetworkPlayer,
  LobbyData,
  NetworkHandler,
  ServerNetworkHandler,
} from 'modloader64_api/NetworkHandler';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import * as API from 'modloader64_api/DK64/Imports';
import * as Net from './network/Imports';

export class Dk64Online implements IPlugin {
  ModLoader = {} as IModLoaderAPI;
  name = 'Dk64Online';

  @InjectCore() core!: API.IDK64Core;

  // Storage Variables
  db = new Net.DatabaseClient();
  
  // Helpers
  /* None Yet! */

  handle_player(bufData: Buffer, bufStorage: Buffer) {
    // Initializers
    let pData: Net.SyncBuffered;
    let i: number;
    let count = 0;
    let needUpdate = false;

    this.handle_kong(bufData, bufStorage, this.core.player.current_kong);
      
    
    // bufData = this.core.player.get_kong_base();
    // bufStorage = this.db.kong_data;
    // count = bufData.byteLength;
    // needUpdate = false;

    // for (i = 0; i < count; i++) {
    //   if (bufData[i] === bufStorage[i]) continue;

    //   bufData[i] |= bufStorage[i];
    //   this.core.player.set_kong_base(i, bufData[i]);
    //   needUpdate = true;
    // }

    // if (needUpdate) {
    //   this.db.kong_data = bufData;
    //   pData = new Net.SyncBuffered(this.ModLoader.clientLobby, 'SyncKongData', bufData, false);
    //   this.ModLoader.clientSide.sendPacket(pData);
    // }

  }

  handle_kong(bufData: Buffer, bufStorage: Buffer, index: number) {
    // Initializers
    let kong = this.core.player.kong[index];
    let dKong = this.db.kong[index] as Net.KongData;
    let sKong = new Net.KongData();
    let pData: Net.SyncKong;
    let needUpdate = false;

    sKong.colored_banana = kong.colored_bananas.array;
    sKong.troff_scoff_banana = kong.colored_bananas.array;
    sKong.golden_banana = kong.colored_bananas.array;
    sKong.moves = kong.moves;
    sKong.simian_slam = kong.simian_slam;
    sKong.weapon = kong.weapon;
    sKong.ammo_belt = kong.ammo_belt;
    sKong.instrument = kong.instrument;
    sKong.coins = kong.coins;
    sKong.instrument_energy = kong.instrument_energy;
    
    // for (i = 0; i < 3; i++)
    //   this.handle_bananas(bufData, bufStorage, index, i);
    
    // Sync Moves Bitfield
    if (dKong.moves !== sKong.moves) {
      dKong.moves |= sKong.moves;
      this.core.player.kong[index].moves = dKong.moves;
      needUpdate = true;
    }

    // Sync Simian Slam Upgrade
    if (dKong.simian_slam > sKong.simian_slam) {
      this.core.player.kong[index].simian_slam = dKong.simian_slam;
    } else if (dKong.simian_slam < sKong.simian_slam) {
      dKong.simian_slam = sKong.simian_slam;
      needUpdate = true;
    }

    // Sync Weapon Bitfield
    if (dKong.weapon !== sKong.weapon) {
      dKong.weapon |= sKong.weapon;
      this.core.player.kong[index].weapon = dKong.weapon;
      needUpdate = true;
    }

    // Sync Bullets
    // if (dKong.ammo_belt < sKong.ammo_belt) {
    //   dKong.ammo_belt = sKong.ammo_belt;
    //   this.core.player.kong[index].ammo_belt = dKong.ammo_belt;
    //   needUpdate = true;
    // }

    // Sync Instruments Bitfield
    if (dKong.instrument !== sKong.instrument) {
      dKong.instrument |= sKong.instrument;
      this.core.player.kong[index].instrument = dKong.instrument;
      needUpdate = true;
    }

    // Sync coins count
    // if (dKong.coins < sKong.coins) {
    //   dKong.coins = sKong.coins;
    //   this.core.player.kong[index].coins = dKong.coins;
    //   needUpdate = true;
    // }
    
    // Sync instrument energy count
    // if (dKong.instrument_energy < sKong.instrument_energy) {
    //   dKong.instrument_energy = sKong.instrument_energy;
    //   this.core.player.kong[index].instrument_energy = dKong.instrument_energy;
    //   needUpdate = true;
    // }

    if (!needUpdate) return;

    this.db.kong[index] = dKong;

    pData = new Net.SyncKong(this.ModLoader.clientLobby, dKong, index, false);
    this.ModLoader.clientSide.sendPacket(pData);    
  }

  handle_game_flags(bufData: Buffer, bufStorage: Buffer, profile: number) {
    // Initializers
    let pData: Net.SyncBuffered;
    let i: number;
    let count = 0;
    let slotAddr = this.core.save.get_slot_address(profile);
    let needUpdate = false;

    bufData = this.core.save.get_slot(slotAddr);
    bufStorage = this.db.game_flags;
    count = bufData.byteLength;
    needUpdate = false;

    for (i = 0; i < count; i++) {
      if (bufData[i] === bufStorage[i]) continue;

      bufData[i] |= bufStorage[i];
      this.core.save.set_slot(slotAddr + i, bufData[i]);
      needUpdate = true;
    }

    if (!needUpdate) return;

    this.db.game_flags = bufData;
    pData = new Net.SyncBuffered(this.ModLoader.clientLobby, 'SyncGameFlags', bufData, false);
    this.ModLoader.clientSide.sendPacket(pData);
  }

  constructor() {}

  preinit(): void {}

  init(): void {}

  postinit(): void {}

  onTick(): void {
    if (!this.core.isPlaying()) return;
      
    // Initializers
    let profile = this.core.runtime.get_current_profile();
    let bufStorage: Buffer;
    let bufData: Buffer;

    // Player Handlers
    this.handle_player(bufData!, bufStorage!);

    // Flag Handlers
    this.handle_game_flags(bufData!, bufStorage!, profile);
  }

  @EventHandler(EventsClient.ON_INJECT_FINISHED)
  onClient_InjectFinished(evt: any) {}

  @EventHandler(EventsServer.ON_LOBBY_CREATE)
  onServer_LobbyCreate(lobby: string) {
    this.ModLoader.lobbyManager.createLobbyStorage(
      lobby, 
      this, 
      new Net.DatabaseServer()
    );
  }

  @EventHandler(EventsClient.CONFIGURE_LOBBY)
  onLobbySetup(lobby: LobbyData): void {
    // Can set configurable settings for a host of
    // lobby to set for a play session. EX: combination with
    // below On_Lobby_Join event.

    // lobby.data['Dk64Online:data1_syncing'] = true;
    // lobby.data['Dk64Online:data2_syncing'] = true;
  }

  @EventHandler(EventsClient.ON_LOBBY_JOIN)
  onClient_LobbyJoin(lobby: LobbyData): void {
    this.db = new Net.DatabaseClient();
    let pData = new Packet('Request_Storage', 'Dk64Online', this.ModLoader.clientLobby, false);
    this.ModLoader.clientSide.sendPacket(pData);

    // Can configure LobbyData here -- Allow hostable settings
    // and lobby based triggers. EX: combination with above
    // Configure_Lobby event.

    // this.LobbyConfig.data1_syncing = lobby.data['Dk64Online:data1_syncing'];
    // this.LobbyConfig.data2_syncing = lobby.data['Dk64Online:data2_syncing'];
    // this.ModLoader.logger.info('OotOnline settings inherited from lobby.');
  }

  @EventHandler(EventsServer.ON_LOBBY_JOIN)
  onServer_LobbyJoin(evt: EventServerJoined) {}

  @EventHandler(EventsServer.ON_LOBBY_LEAVE)
  onServer_LobbyLeave(evt: EventServerLeft) {
    let storage: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(evt.lobby, this) as Net.DatabaseServer;
  }

  @EventHandler(EventsClient.ON_SERVER_CONNECTION)
  onClient_ServerConnection(evt: any) {}

  @EventHandler(EventsClient.ON_PLAYER_JOIN)
  onClient_PlayerJoin(nplayer: INetworkPlayer) {}

  @EventHandler(EventsClient.ON_PLAYER_LEAVE)
  onClient_PlayerLeave(nplayer: INetworkPlayer) {}

  // #################################################
  // ##  Server Receive Packets
  // #################################################

  @ServerNetworkHandler('Request_Storage')
  onServer_RequestStorage(packet: Packet): void {
    this.ModLoader.logger.info('[Server] Sending: {Lobby Storage}');
    let sDB: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
    let pData = new Net.SyncStorage(
      packet.lobby,
      sDB.kong,
      sDB.game_flags
    );
    this.ModLoader.serverSide.sendPacketToSpecificPlayer(pData, packet.player);
  }
  
  @ServerNetworkHandler('SyncKong')
  onServer_SyncKongData(packet: Net.SyncKong) {
    this.ModLoader.logger.info('[Server] Received: {Kong Data}');

    // Initializers
    let sDB: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
    let dKong = sDB.kong[packet.kong_index] as Net.KongData;
    let sKong = packet.kong;
    let pData: Net.SyncKong;
    let needUpdate = false;
    
    // for (i = 0; i < 3; i++)
    //   this.handle_bananas(bufData, bufStorage, index, i);
    
    // Sync Moves Bitfield
    if (dKong.moves !== sKong.moves) {
      dKong.moves |= sKong.moves;
      needUpdate = true;
    }

    // Sync Simian Slam Upgrade
    if (dKong.simian_slam < sKong.simian_slam) {
      dKong.simian_slam = sKong.simian_slam;
      needUpdate = true;
    }

    // Sync Weapon Bitfield
    if (dKong.weapon !== sKong.weapon) {
      dKong.weapon |= sKong.weapon;
      needUpdate = true;
    }

    // Sync Bullets
    // if (dKong.ammo_belt < sKong.ammo_belt) {
    //   dKong.ammo_belt = sKong.ammo_belt;
    //   this.core.player.kong[index].ammo_belt = dKong.ammo_belt;
    //   needUpdate = true;
    // }

    // Sync Instruments Bitfield
    if (dKong.instrument !== sKong.instrument) {
      dKong.instrument |= sKong.instrument;
      needUpdate = true;
    }

    // Sync coins count
    // if (dKong.coins < sKong.coins) {
    //   dKong.coins = sKong.coins;
    //   needUpdate = true;
    // }
    
    // Sync instrument energy count
    // if (dKong.instrument_energy < sKong.instrument_energy) {
    //   dKong.instrument_energy = sKong.instrument_energy;
    //   needUpdate = true;
    // }
  
    if (!needUpdate) return;

    sDB.kong[packet.kong_index] = dKong;
  
    pData = new Net.SyncKong(packet.lobby, dKong, packet.kong_index, true);
    this.ModLoader.serverSide.sendPacket(pData);

    this.ModLoader.logger.info('[Server] Updated: {Kong Data}');
  }
    
  @ServerNetworkHandler('SyncGameFlags')
  onServer_SyncGameFlags(packet: Net.SyncBuffered) {
    this.ModLoader.logger.info('[Server] Received: {Game Flags}');

    let sDB: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
    let data: Buffer = sDB.game_flags;
    let count: number = data.byteLength;
    let i = 0;
    let needUpdate = false;
  
    for (i = 0; i < count; i++) {
      if (data[i] === packet.value[i]) continue;
      
      data[i] |= packet.value[i];
      needUpdate = true;
    }
  
    if (!needUpdate) return;
  
    sDB.game_flags = data;
  
    let pData = new Net.SyncBuffered(packet.lobby, 'SyncGameFlags', data, true);
    this.ModLoader.serverSide.sendPacket(pData);
  
    this.ModLoader.logger.info('[Server] Updated: {Game Flags}');
  }

  // #################################################
  // ##  Client Receive Packets
  // #################################################

  @NetworkHandler('SyncStorage')
  onClient_SyncStorage(packet: Net.SyncStorage): void {
    this.ModLoader.logger.info('[Client] Received: {Lobby Storage}');
    this.db.kong = packet.kong;
    this.db.game_flags = packet.game_flags;
  }
  
  @NetworkHandler('SyncKong')
  onClient_SyncKongData(packet: Net.SyncKong) {
    this.ModLoader.logger.info('[Client] Received: {Kong Data}');
    
    // Initializers
    let dKong = this.db.kong[packet.kong_index] as Net.KongData;
    let sKong = packet.kong;
    let needUpdate = false;
    
    // for (i = 0; i < 3; i++)
    //   this.handle_bananas(bufData, bufStorage, index, i);
    
    // Sync Moves Bitfield
    if (dKong.moves !== sKong.moves) {
      dKong.moves |= sKong.moves;
      needUpdate = true;
    }

    // Sync Simian Slam Upgrade
    if (dKong.simian_slam < sKong.simian_slam) {
      dKong.simian_slam = sKong.simian_slam;
      needUpdate = true;
    }

    // Sync Weapon Bitfield
    if (dKong.weapon !== sKong.weapon) {
      dKong.weapon |= sKong.weapon;
      needUpdate = true;
    }

    // Sync Bullets
    // if (dKong.ammo_belt < sKong.ammo_belt) {
    //   dKong.ammo_belt = sKong.ammo_belt;
    //   this.core.player.kong[index].ammo_belt = dKong.ammo_belt;
    //   needUpdate = true;
    // }

    // Sync Instruments Bitfield
    if (dKong.instrument !== sKong.instrument) {
      dKong.instrument |= sKong.instrument;
      needUpdate = true;
    }

    // Sync coins count
    // if (dKong.coins < sKong.coins) {
    //   dKong.coins = sKong.coins;
    //   needUpdate = true;
    // }
    
    // Sync instrument energy count
    // if (dKong.instrument_energy < sKong.instrument_energy) {
    //   dKong.instrument_energy = sKong.instrument_energy;
    //   needUpdate = true;
    // }

    if (!needUpdate) return;
    
    this.db.kong[packet.kong_index] = dKong;

    this.ModLoader.logger.info('[Client] Updated: {Kong Data}');
  }

  @NetworkHandler('SyncGameFlags')
  onClient_SyncGameFlags(packet: Net.SyncBuffered) {
    this.ModLoader.logger.info('[Client] Received: {Game Flags}');

    let data: Buffer = this.db.game_flags;
    let count: number = data.byteLength;
    let i = 0;
    let needUpdate = false;

    for (i = 0; i < count; i++) {
      if (data[i] === packet.value[i]) continue;

      data[i] |= packet.value[i];
      needUpdate = true;
    }

    if (!needUpdate) return;
      
    this.db.game_flags = data;

    this.ModLoader.logger.info('[Client] Updated: {Game Flags}');
  }
}
