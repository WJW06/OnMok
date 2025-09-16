import './App.css';
import { useState } from 'react';

const rcCount: number = 18;

export default function Board() {
  const [zones, setZones] = useState<string[]>(Array<string>(rcCount * rcCount).fill(""));
  const [isFirst, setIsFirst] = useState<boolean>(true);

  type MakeRowProps = {
    offset: number;
  }

  function MakeRowZones({ offset }: MakeRowProps) {
    const row: number = rcCount * offset;
    return (
      <>
        <div className="board-row">
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
    return <button className='zone' onClick={() => ClickZone(index)}>{zones[index]}</button>;
  }

  function ClickZone(index: number) {
    if (zones[index]) return;
    const nextZones = zones.slice(); // copy
    nextZones[index] = isFirst ? "○" : "●";
    setZones(nextZones);
    setIsFirst(!isFirst);
  }

  function ResetZones() {
    const resetZones = zones.slice();
    for (let i = 0; i < rcCount * rcCount; ++i) {
      resetZones[i] = "";
    }
    setZones(resetZones);
    setIsFirst(true);
  }

  return (
    <>
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

      <div className='reset-button'>
        <button onClick={ResetZones}>Reset Game</button>
      </div>
    </>
  );
}