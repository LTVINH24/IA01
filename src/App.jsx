import { useState } from 'react';
import './App.css';

function Square({ value, onSquareClick, className }) {
  return (
    <button className={`square ${className || ''}`} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay,rows,columns }) {
  const gameStatus = checkCurrentGameStatus(squares, columns, rows);
  let status;
  let winningLine = [];
  
  if (gameStatus.winner) {
    status = gameStatus.winner === 'Draw' ? 'Game Draw!' : 'Winner: ' + gameStatus.winner;
    winningLine = gameStatus.line || [];
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  function handleClick(i) {
    if (gameStatus.winner || squares[i]) {
      return;
    }
    
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares, i);
  }
  return (
    <>
      <div className="status">{status}</div>
      {Array.from({length:rows}).map((_, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {Array.from({length:columns}).map((_, colIndex) => {
            const squareIndex = rowIndex * columns + colIndex;
            const isWinningSquare = winningLine && winningLine.includes(squareIndex);
            return (
              <Square
                key={squareIndex}
                value={squares[squareIndex]}
                onSquareClick={() => handleClick(squareIndex)}
                className={isWinningSquare ? 'winning' : ''}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

export default function Game() {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [history, setHistory] = useState([Array(rows * columns).fill(null)]);
  const [movePositions, setMovePositions] = useState([null]); // Track positions for each move
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const [isAscending, setIsAscending] = useState(true); 
  function handlePlay(nextSquares, moveIndex) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    const row = Math.floor(moveIndex / columns);
    const col = moveIndex % columns;
    const nextMovePositions = [...movePositions.slice(0, currentMove + 1), { row, col }];
    
    setHistory(nextHistory);
    setMovePositions(nextMovePositions);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  function handleRowsChange(e) {
    const newRows = parseInt(e.target.value);
    if (newRows >= 3 && newRows <= 10) {
      setRows(newRows);
      const newSize = newRows * columns;
      setHistory([Array(newSize).fill(null)]);
      setMovePositions([null]); // Reset move positions
      setCurrentMove(0);
    }
  }

  function handleColumnsChange(e) {
    const newColumns = parseInt(e.target.value);
    if (newColumns >= 3 && newColumns <= 10) {
      setColumns(newColumns);
      const newSize = rows * newColumns;
      setHistory([Array(newSize).fill(null)]);
      setMovePositions([null]); // Reset move positions
      setCurrentMove(0);
    }
  }

  const moves = history.map((squares, move) => {
    let moveDescription;
    const position = movePositions[move];
    const locationText = position ? ` (${position.row}, ${position.col})` : '';
    
    if (move === currentMove && move !== 0){
      moveDescription = <p>You are at move #{move}{locationText}</p>;
    }
    else{
      if (move > 0) {
        moveDescription = <button onClick={() => jumpTo(move)}>{'Go to move #' + move + locationText}</button>
      } else {
        moveDescription = <button onClick={() => jumpTo(move)}>{'Go to game start'}</button>;
      }
    }
    return (
      <li key={move}>
        {moveDescription}
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <div className="board-controls">
          <div className="size-controls">
            <label>
              Rows:
              <input 
                type="number" 
                min="3" 
                max="10" 
                value={rows} 
                onChange={handleRowsChange}
              />
            </label>
            <label>
              Columns:
              <input 
                type="number" 
                min="3" 
                max="10" 
                value={columns} 
                onChange={handleColumnsChange}
              />
            </label>
          </div>
        </div>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} rows={rows} columns={columns}  />
      </div>
      <div className="game-info">
        <div className='history'>
          <h3>Game History</h3>
          <button className='toggle-order' onClick={() => setIsAscending(!isAscending)}>
            {isAscending ? 'Descending' : 'Ascending'}
          </button>
        </div>
        <ol>{isAscending ? moves : [...moves].reverse()}</ol>
      </div>
    </div>
  );
}

function indexToRowCol(index, columns) {
  const row = Math.floor(index / columns);
  const col = index % columns;
  return { row, col };
}
function calculateWinner(squares,currentIndex,columns,rows) {
  const { row, col } = indexToRowCol(currentIndex, columns);
  const player = squares[currentIndex];
  if (!player) return null;

  const directions = [
    { dr: 0, dc: 1 },   
    { dr: 1, dc: 0 },   
    { dr: 1, dc: 1 },   
    { dr: 1, dc: -1 }   
  ];
  for (const { dr, dc } of directions) {
    let count = 1;
    const line = [[row, col]];
    for (let dir = -1; dir <= 1; dir += 2) {
      let r = row + dir * dr;
      let c = col + dir * dc;
      while (r >= 0 && r < rows
              && c >= 0 && c < columns
              && squares[r * columns + c] === player) {
              count++;
              line.push([r, c]);
              r += dir * dr;
              c += dir * dc;
      }
    }
    if (count >= 3) {
      return {winner: player, line: line.map(([r, c]) => r * columns + c)};
    }
  }
  return null;
}

function checkCurrentGameStatus(squares, columns, rows) {
  for (let i = 0; i < squares.length; i++) {
    if (squares[i]) {
      const result = calculateWinner(squares, i, columns, rows);
      if (result) {
        return { winner: result.winner, line: result.line };
      }
    }
  }
  if (squares.every(square => square !== null)) {
    return { winner: 'Draw', line: [] };
  }
  
  return { winner: null, line: [] };
}
