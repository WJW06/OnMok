import React, { useEffect, useRef, useState } from 'react';
import { socket } from "../socket";
import '../styles/Ground.css';
import '../styles/Ground-responsive.css';

// [Game setting (*Don't touch*)]
const rcCount: number = 18;

const Board: React.FC = () => {
  // [Game-state variables]
  const [zones, setZones] = useState<string[]>(Array<string>(rcCount * rcCount).fill(""));
  const r_id = useRef<string | null>(null);
  const player1 = useRef<string | null>(null);
  const player2 = useRef<string | null>(null);
  let selectZone = useRef(-1);
  let isPlaying = useRef(true);
  let turn = useRef(0);
  let player1Zones = useRef(Array<boolean>(rcCount * rcCount).fill(false));
  let player1Count = useRef(0);
  let player2Zones = useRef(Array<boolean>(rcCount * rcCount).fill(false));
  let player2Count = useRef(0);

  useEffect(() => {
    fetch("http://localhost:5000/Ground")
      .then((res) => res.json())
      .then((data) => { console.log(data) })

    socket.on("makeBoard", ({ b_player1, b_player2 }) => {
      const session_r_id = sessionStorage.getItem("currentRoom");
      r_id.current = session_r_id;
      player1.current = b_player1;
      player2.current = b_player2;
    });

    return () => {
      OutGame();
      socket.off("makeBoard");
    }
  }, []);

  // [Server part]
  function OutGame() {
    if (r_id.current) {
      const url = "http://localhost:4000/OutGame";
      const body = JSON.stringify({ r_id: r_id.current });
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    }
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
    return <button className='zone' onClick={() => SelectZone(index)}>{zones[index]}</button>;
  }

  // {UI part}
  function GoRoomButton() {
    if (isPlaying.current) return <></>;

    return (
      <button className='start-button' onClick={StartGame}>
        Go Room
      </button>
    );
  }

  function ResetButton() {
    return <button className='reset-button' onClick={() => { if (isPlaying.current) InitGameState(); }}>Reset Game</button>;
  }

  function MakeTurnText() {
    console.log(isPlaying.current);
    if (isPlaying.current) return <span className='turn-text' style={{ display: 'block' }}>turn: {turn.current + 1}</span>
    else return <span className='turn-text' style={{ display: 'none' }}>turn: {turn.current + 1}</span>
  }

  // {Chat part}
  function MakeChatWindow() {
    return (
      <div className='chats-div'>

      </div>
    );
  }

  function MakeChatInput() {
    return (
      <>
        <span className='nickname'>닉네임: </span><input className='chat-input'></input>
      </>
    );
  }


  // [GameManager part]
  function StartGame() {
    const startButton = document.querySelector('.start-button');
    if (startButton instanceof HTMLButtonElement) {
      console.log("startButton none");
      startButton.style.display = 'none';
    }

    const turnText = document.querySelector('.turn-text');
    if (turnText instanceof HTMLSpanElement) {
      console.log("turnText none");
      turnText.style.display = 'block';
    }

    isPlaying.current = true;
  }

  function InitGameState() {
    const resetZones = zones.slice();
    for (let i = 0; i < rcCount * rcCount; ++i) {
      resetZones[i] = "";
      player1Zones.current[i] = false;
      player2Zones.current[i] = false;
    }
    setZones(resetZones);
    turn.current = 0;
    isPlaying.current = false;
    player1Count.current = 0;
    player2Count.current = 0;

    console.log("[InitGameState Start]")
    console.log("isPlaying: " + isPlaying);
    console.log("Zones: " + zones);
    console.log("turn: " + turn);
    console.log("player1Zones: " + player1Zones);
    console.log("player1Count: " + player1Count);
    console.log("player2Zones: " + player2Zones);
    console.log("player2Count: " + player2Count);
    console.log("[InitGameState End]")
  }

  function SelectZone(index: number) {
    if (isPlaying.current === false || zones[index] || index === -1) return;
    const nextZones = zones.slice(); // copy
    nextZones[index] = turn.current % 2 === 0 ? "●" : "○";
    setZones(nextZones);
    selectZone.current = index;

    if (turn.current % 2 === 0) {
      player1Zones.current[index] = true;
      if (++player1Count.current > 4) CheckWinner();
    }
    else {
      player2Zones.current[index] = true;
      if (++player2Count.current > 4) CheckWinner();
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

  function CheckWinner() {
    console.log("Checking Winner...");
    const winner: number = CheckLine();

    if (winner !== 0) {
      const startButton = document.querySelector('.start-button');
      if (startButton instanceof HTMLButtonElement) {
        console.log("startButton none");
        startButton.style.display = 'none';
      }

      if (winner === 1) {
        alert("Winner: Player1!");
      }

      if (winner === 2) {
        alert("Winner: Player2!");
      }

      isPlaying.current = false;
    }
  }

  // [main loop]
  return (
    <>
      <div className='ui-ground'>
        <MakeTurnText></MakeTurnText>
        <GoRoomButton></GoRoomButton>
        <ResetButton></ResetButton>
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

      <div className='chat-ground'>
        <MakeChatWindow></MakeChatWindow>
        <MakeChatInput></MakeChatInput>
      </div>
    </>
  );
}

export default Board;