const els=Object.fromEntries(['mode','aiBox','netBox','room','join','new','undo','flip','status','moves','promo','elo','eloVal','side'].map(k=>[k,document.getElementById(k)]));
new Controller(new Game(),document.getElementById('board'),els);
