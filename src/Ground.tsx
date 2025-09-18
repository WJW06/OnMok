import './Ground.css';
import './Ground-responsive.css';
import { useState } from 'react';

// [Game setting (*Don't touch*)]
const rcCount: number = 18;

// [Game-state variables]
let isPlaying: boolean = false;
let turn: number = 0;
let selectZone: number = -1;
let player1Zones: boolean[] = Array<boolean>(rcCount * rcCount).fill(false);
let player1Count: number = 0;
let player2Zones: boolean[] = Array<boolean>(rcCount * rcCount).fill(false);
let player2Count: number = 0;
let isGameEnd: boolean = false;

export default function Board() {
  const [zones, setZones] = useState<string[]>(Array<string>(rcCount * rcCount).fill(""));

  // [Make Board part]
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


  // [GameManager part]
  function StartGame() {
    const startButton = document.querySelector('.start-button');
    if (startButton instanceof HTMLButtonElement) {
      startButton.style.display = 'none';
    }
    isPlaying = true;
  }

  function InitGameState() {
    const resetZones = zones.slice();
    for (let i = 0; i < rcCount * rcCount; ++i) {
      resetZones[i] = "";
      player1Zones[i] = false;
      player2Zones[i] = false;
    }
    setZones(resetZones);
    turn = 0;
    isPlaying = false;
    player1Count = 0;
    player2Count = 0;
    isGameEnd = false;

    console.log("isPlaying: " + isPlaying);
    console.log("Zones: " + zones);
    console.log("turn: " + turn);
    console.log("player1Zones: " + player1Zones);
    console.log("player1Count: " + player1Count);
    console.log("player2Zones: " + player2Zones);
    console.log("player2Count: " + player2Count);
    console.log("isGameEnd: " + isGameEnd);
  }

  function SelectZone(index: number) {
    if (isPlaying === false || zones[index] || isGameEnd) return;
    const nextZones = zones.slice(); // copy
    nextZones[index] = turn % 2 === 0 ? "●" : "○";
    setZones(nextZones);
    selectZone = index;

    if (turn % 2 === 0) {
      player1Zones[index] = true;
      if (++player1Count > 4) CheckWinner();
    }
    else {
      player2Zones[index] = true;
      if (++player2Count > 4) CheckWinner();
    }
    ++turn;

    console.log("SelectZone: " + selectZone);
  }

  function FirstWinCase(curPlayer: boolean[]) {
    let curZone: number = selectZone;
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
    let curZone: number = selectZone;
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
    let curZone: number = selectZone;
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
    let curZone: number = selectZone;
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
    let curPlayer: boolean[] = turn % 2 === 0 ? player1Zones : player2Zones;

    if (FirstWinCase(curPlayer) || SecondWinCase(curPlayer)
      || ThirdWinCase(curPlayer) || FourthWinCase(curPlayer)) {
      if (turn % 2 === 0) return 1;
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
        startButton.style.display = 'none';
      }
      isGameEnd = true;

      if (winner === 1) {
        alert("Winner: Player1!");
      }

      if (winner === 2) {
        alert("Winner: Player2!");
      }
    }
  }


  // [Make UI part]
  function StartButton() {
    if (isPlaying) return <></>;

    return (
      <button className='start-button' onClick={StartGame}>
        Start Game
      </button>
    );
  }

  function ResetButton() {
    return <button className='reset-button' onClick={() => { if (isPlaying) InitGameState(); }}>Reset Game</button>;
  }

  return (
    <div className='board-ground'>
      <StartButton></StartButton>
      <ResetButton></ResetButton>
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
  );
}