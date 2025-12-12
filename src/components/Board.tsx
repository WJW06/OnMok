import React, { useEffect, useRef, useState } from 'react';
import { socket } from "../socket";
import WinnerOverlay from "./WinnerOverlay"
import '../styles/Board.css';
import '../styles/Board-responsive.css';

// [Game setting (*Don't touch*)]
const rcCount: number = 18;

const Board: React.FC = () => {
  // [Game-state variables]
  const [zones, setZones] = useState<string[]>(Array<string>(rcCount * rcCount).fill(""));
  // const r_id = useRef<string | null>(null);
  const player1 = useRef<string>("");
  const player2 = useRef<string>("");
  let selectZone = useRef(-1);
  let isPlaying = useRef(true);
  let turn = useRef(0);
  let player1Zones = useRef(Array<boolean>(rcCount * rcCount).fill(false));
  let player1Count = useRef(0);
  let player2Zones = useRef(Array<boolean>(rcCount * rcCount).fill(false));
  let player2Count = useRef(0);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  useEffect(() => {
    socket.on("makeBoard", ({ b_player1, b_player2, zonesState, turnState, b_isPlaying }) => {
      player1.current = b_player1;
      player2.current = b_player2;
      turn.current = turnState;
      isPlaying.current = b_isPlaying;
      setZones(zonesState);
      InitGameState(zonesState);
      window.playGameBGM();
    });

    socket.on("placeZone", ({ b_zones, index }) => {
      SelectZone(index);
      setZones(b_zones);
      window.playPlaceSound();
    });

    socket.on("timeout", ()=> {
      if (isPlaying.current){
        if (turn.current % 2 === 0) CheckWinner(2);
        else CheckWinner(1);
      }
    });

    return () => {
      socket.off("makeBoard");
      socket.off("placeZone");
      socket.off("timeout");
      window.playMainBGM();
    }
  }, []);

  // [Server part]
  const handleSelectZone = (index: number) => {
    if (isPlaying.current === false || zones[index] !== "" || index === -1) {
      console.log("ended Game!");
      return;
    }

    const r_id = sessionStorage.getItem("currentRoom");
    console.log("select:", r_id, "turn:", turn.current, "index:", index);
    socket.emit("selectZone", { r_id: r_id, turn: turn.current, index: index });
  }

  const handleEndedGame = (winner: string, loser: string) => {
    const r_id = sessionStorage.getItem("currentRoom");
    socket.emit("endedGame",
      { r_id: r_id, winner: winner, loser: loser });
  }

  const handleGoRoom = () => {
    const r_id = sessionStorage.getItem("currentRoom");
    socket.emit("goRoom", { r_id: r_id });
  }


  // [Make UI part]
  type MakeRowProps = {
    offset: number;
  }

  function MakeRowZones({ offset }: MakeRowProps) {
    const row: number = rcCount * offset;
    return (
      <>
        <div className='board-row'>
          <MakeZone index={row + 0}></MakeZone>
          <MakeZone index={row + 1}></MakeZone>
          <MakeZone index={row + 2}></MakeZone>
          <MakeZone index={row + 3}></MakeZone>
          <MakeZone index={row + 4}></MakeZone>
          <MakeZone index={row + 5}></MakeZone>
          <MakeZone index={row + 6}></MakeZone>
          <MakeZone index={row + 7}></MakeZone>
          <MakeZone index={row + 8}></MakeZone>
          <MakeZone index={row + 9}></MakeZone>
          <MakeZone index={row + 10}></MakeZone>
          <MakeZone index={row + 11}></MakeZone>
          <MakeZone index={row + 12}></MakeZone>
          <MakeZone index={row + 13}></MakeZone>
          <MakeZone index={row + 14}></MakeZone>
          <MakeZone index={row + 15}></MakeZone>
          <MakeZone index={row + 16}></MakeZone>
          <MakeZone index={row + 17}></MakeZone>
        </div>
      </>
    );
  }

  type MakeZoneProps = {
    index: number;
  }

  function MakeZone({ index }: MakeZoneProps) {
    return <button className='zone' onClick={() => handleSelectZone(index)}>{zones[index]}</button>;
  }

  // {UI part}
  function GoRoomButton() {
    if (isPlaying.current) return <></>;

    return (
      <button className='goRoom-button' onClick={handleGoRoom}>
        Go Room
      </button>
    );
  }

  function MakeTurnText() {
    console.log(isPlaying.current);
    if (isPlaying.current) return <span className='turn-text' style={{ display: 'block' }}>turn: {turn.current + 1}</span>
    else return <span className='turn-text' style={{ display: 'none' }}>turn: {turn.current + 1}</span>
  }


  // [GameManager part]
  function InitGameState(zonesState: Array<string>) {
    console.log("InitGameState zones:", zonesState);
    for (let i = 0; i < rcCount * rcCount; ++i) {
      player1Zones.current[i] = zonesState[i] === "●" ? true : false;
      player2Zones.current[i] = zonesState[i] === "○" ? true : false;
    }
    player1Count.current = turn.current / 2;
    player2Count.current = (turn.current - 1) / 2;
  }

  function SelectZone(index: number) {
    const nextZones = zones.slice(); // copy
    nextZones[index] = turn.current % 2 === 0 ? "●" : "○";
    setZones(nextZones);
    selectZone.current = index;

    if (turn.current % 2 === 0) {
      player1Zones.current[index] = true;
      if (++player1Count.current > 4) CheckWinner(0);
    }
    else {
      player2Zones.current[index] = true;
      if (++player2Count.current > 4) CheckWinner(0);
    }
    ++turn.current;

    console.log("SelectZone: " + selectZone.current);
  }

  function FirstWinCase(curPlayer: boolean[]) {
    let curZone: number = selectZone.current;
    let zoneCount: number = 1;

    // Move left
    while (curPlayer[curZone]) {
      if (curPlayer[curZone - 1] === false
        || curZone % rcCount === 0) {
        break;
      }
      else --curZone;
    }

    // Check right count
    while (curPlayer[curZone]) {
      if (curPlayer[curZone + 1] === false
        || curZone + 1 % rcCount === 0) {
        return false;
      }
      else {
        ++zoneCount;
        ++curZone;
        if (zoneCount === 5) return true;
      }
    }
  }

  function SecondWinCase(curPlayer: boolean[]) {
    let curZone: number = selectZone.current;
    let zoneCount: number = 1;

    // Move top
    while (curPlayer[curZone]) {
      if (curPlayer[curZone - rcCount] === false
        || curZone - rcCount < 0) {
        break;
      }
      else curZone -= rcCount;
    }

    // Check bottom count
    while (curPlayer[curZone]) {
      if (curPlayer[curZone + rcCount] === false
        || curZone + rcCount >= rcCount * rcCount) {
        return false;
      }
      else {
        ++zoneCount;
        curZone += rcCount;
        if (zoneCount === 5) return true;
      }
    }
  }

  function ThirdWinCase(curPlayer: boolean[]) {
    let curZone: number = selectZone.current;
    let zoneCount: number = 1;

    // Move left-top
    while (curPlayer[curZone]) {
      if (curPlayer[curZone - 1 - rcCount] === false
        || (curZone % rcCount === 0 || curZone - rcCount < 0)) {
        break;
      }
      else curZone = curZone - 1 - rcCount;
    }

    // Check right-bottom count
    while (curPlayer[curZone]) {
      if (curPlayer[curZone + 1 + rcCount] === false
        || (curZone + 1 % rcCount === 0 || curZone + rcCount >= rcCount * rcCount)) {
        return false;
      }
      else {
        ++zoneCount;
        curZone = curZone + 1 + rcCount;
        if (zoneCount === 5) return true;
      }
    }
  }

  function FourthWinCase(curPlayer: boolean[]) {
    let curZone: number = selectZone.current;
    let zoneCount: number = 1;

    // Move left-bottom
    while (curPlayer[curZone]) {
      if (curPlayer[curZone - 1 + rcCount] === false
        || (curZone % rcCount === 0 || curZone + rcCount >= rcCount * rcCount)) {
        break;
      }
      else curZone = curZone - 1 + rcCount;
    }

    // Check right-top count
    while (curPlayer[curZone]) {
      if (curPlayer[curZone + 1 - rcCount] === false
        || (curZone + 1 % rcCount === 0 || curZone - rcCount < 0)) {
        return false;
      }
      else {
        ++zoneCount;
        curZone = curZone + 1 - rcCount;
        if (zoneCount === 5) return true;
      }
    }
  }

  function CheckLine() {
    let curPlayer: boolean[] = turn.current % 2 === 0 ? player1Zones.current : player2Zones.current;

    if (FirstWinCase(curPlayer) || SecondWinCase(curPlayer)
      || ThirdWinCase(curPlayer) || FourthWinCase(curPlayer)) {
      if (turn.current % 2 === 0) return 1;
      else return 2;
    }
    else return 0;
  }

  function CheckWinner(timeoutWinner: number) {
    const winner: number = CheckLine();

    if (winner !== 0 || timeoutWinner !== 0) {
      const goRoom_Button = document.querySelector('.goRoom-button');
      if (goRoom_Button instanceof HTMLButtonElement) {
        goRoom_Button.style.display = 'none';
        console.log("startButton none");
      }

      if (winner === 1 || timeoutWinner === 1) {
        setWinnerMessage(`${player1.current} Win!`);
        handleEndedGame(player1.current, player2.current);
      }

      if (winner === 2 || timeoutWinner === 2) {
        setWinnerMessage(`${player2.current} Win!`);
        handleEndedGame(player2.current, player1.current);
      }

      isPlaying.current = false;
    }
  }

  // [main loop]
  return (
    <>
      <div className='ui-board'>
        <MakeTurnText></MakeTurnText>
        <GoRoomButton></GoRoomButton>
      </div>

      <div className='board-ground'>
        <MakeRowZones offset={0}></MakeRowZones>
        <MakeRowZones offset={1}></MakeRowZones>
        <MakeRowZones offset={2}></MakeRowZones>
        <MakeRowZones offset={3}></MakeRowZones>
        <MakeRowZones offset={4}></MakeRowZones>
        <MakeRowZones offset={5}></MakeRowZones>
        <MakeRowZones offset={6}></MakeRowZones>
        <MakeRowZones offset={7}></MakeRowZones>
        <MakeRowZones offset={8}></MakeRowZones>
        <MakeRowZones offset={9}></MakeRowZones>
        <MakeRowZones offset={10}></MakeRowZones>
        <MakeRowZones offset={11}></MakeRowZones>
        <MakeRowZones offset={12}></MakeRowZones>
        <MakeRowZones offset={13}></MakeRowZones>
        <MakeRowZones offset={14}></MakeRowZones>
        <MakeRowZones offset={15}></MakeRowZones>
        <MakeRowZones offset={16}></MakeRowZones>
        <MakeRowZones offset={17}></MakeRowZones>
      </div>

      {winnerMessage && (
        <WinnerOverlay
          message={winnerMessage}
          onFinish={() => setWinnerMessage(null)}
        />)}
    </>
  );
}

export default Board;