const FILES='abcdefgh';
const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const GLYPH={k:'♚\uFE0E',q:'♛\uFE0E',r:'♜\uFE0E',b:'♝\uFE0E',n:'♞\uFE0E',p:'♟\uFE0E'};
const DIRS={
  n:[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
  b:[[-1,-1],[-1,1],[1,-1],[1,1]],
  r:[[-1,0],[1,0],[0,-1],[0,1]]
};
DIRS.q=[...DIRS.b,...DIRS.r];
DIRS.k=DIRS.q;
const RIGHTS={60:'KQ',63:'K',56:'Q',4:'kq',7:'k',0:'q'};
