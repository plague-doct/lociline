/* ============================================================================
   Loci Line — the shapes a walk folds into.

   Shared by the student tool (app.html), which folds a student's walk into its
   book's shape at the reveal, and the teacher's page (teacher.html), which
   draws the same picture small. Pure geometry: each emblem is drawn in a box
   100 wide and h tall, and its deco() draws with a p5-style object (a p5
   sketch in the tool, a small canvas adapter on the teacher's page).
============================================================================ */
/* a path from a start point and a list of cubic segments [c1, c2, end] */
function bezPath(start, segs, n){
  const out = [start.slice()];
  let p0 = start;
  segs.forEach(([c1, c2, p3]) => {
    for(let i = 1; i <= (n || 18); i++){
      const t = i / (n || 18), u = 1 - t;
      out.push([u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p3[0],
                u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p3[1]]);
    }
    p0 = p3;
  });
  return out;
}
/* a spiral inward from angle a0 at radius r0, through `turns`, to radius r1 */
function spiralPath(cx, cy, r0, r1, a0, turns, dir, n){
  const out = [];
  n = n || 90;
  for(let i = 0; i <= n; i++){
    const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
    out.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
  }
  return out;
}
const mirrorX = pts => pts.map(q => [100 - q[0], q[1]]);
const joinPaths = (...ps) => ps.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);

/* Each emblem is drawn in a box 100 wide and h tall. `left` and `right` are
   the two sides of the fork; whichever side of the real room lies to the left
   on the plan goes to `left`. */
const EMBLEMS = {
  rose: (() => {
    /* Seen from above, a rose is petals round a heart. Each scene is one
       petal, in reading order clockwise from the top: the way in runs out from
       the heart, the two sides of the fork are the petal's two edges, and the
       last stretch comes back down its middle vein to the heart, where the
       next scene starts. The last scene curls into the heart itself. */
    const C = [50, 46], R = 40;
    const frame = (k, n) => {
      const th = -Math.PI/2 + k * 2*Math.PI / n, c = Math.cos(th), sn = Math.sin(th);
      return q => [C[0] + q[0]*c - q[1]*sn, C[1] + q[0]*sn + q[1]*c];
    };
    const halfW = n => Math.min(17, R * Math.sin(Math.PI / Math.max(n, 2)) * 0.9);
    const edge = (w, s) => bezPath([11, 0], [[[14, -s*w], [27, -s*w*1.2], [35, -s*w*0.55]], [[38, -s*w*0.25], [R, -s*w*0.05], [R, 0]]]);
    const petal = (k, n) => {
      const w = halfW(n), f = frame(k, n);
      const lead = [[2, 0], [11, 0]].map(f);
      let tail = bezPath([R, 0], [[[30, w*0.32], [17, -w*0.2], [4, 0]]]).map(f);
      if(k === n - 1){
        const th = -Math.PI/2 + k * 2*Math.PI / n;
        tail = joinPaths(tail, spiralPath(C[0], C[1], 4, 0.6, th, 1.4, 1, 40));
      }
      return {lead, left: edge(w, 1).map(f), right: edge(w, -1).map(f), tail};
    };
    const stem = bezPath([50, 124], [[[44, 108], [56, 94], [50, 80]]]);
    return {
      name: 'rose', h: 125,
      caption: 'The whole act, folded into one rose: each scene is a petal, read clockwise from the top. You walk out from the heart, round the two edges of the petal (the two sides of the fork) and back down its middle to the heart, where the next scene starts.',
      legsFor: petal,
      deco(g, X, Y, a, n){
        g.noStroke();
        // the stem and its leaves first, so the bloom sits on top
        g.noFill(); g.stroke(118, 160, 112, 150*a); g.strokeWeight(Math.max(2, X(2.2) - X(0)));
        g.beginShape(); stem.forEach(q => g.vertex(X(q[0]), Y(q[1]))); g.endShape();
        g.noStroke(); g.fill(118, 160, 112, 110*a);
        [[1, 108], [-1, 96]].forEach(([sd, y]) => {
          g.beginShape();
          bezPath([50, y], [[[50 + sd*8, y - 10], [50 + sd*20, y - 8], [50 + sd*24, y - 3]]], 10)
            .concat(bezPath([50 + sd*24, y - 3], [[[50 + sd*18, y + 4], [50 + sd*8, y + 5], [50, y]]], 10))
            .forEach(q => g.vertex(X(q[0]), Y(q[1])));
          g.endShape(g.CLOSE);
        });
        // the petals, then the heart
        for(let k = 0; k < n; k++){
          const P = petal(k, n);
          g.fill(214, 120, 128, 62*a);
          g.beginShape(); P.lead.concat(P.left, P.right.slice().reverse()).forEach(q => g.vertex(X(q[0]), Y(q[1]))); g.endShape(g.CLOSE);
        }
        // an inner whorl, turned half a petal, so it reads as a rose and not a daisy
        for(let k = 0; k < n; k++){
          const th = -Math.PI/2 + (k + 0.5) * 2*Math.PI / n, c = Math.cos(th), sn = Math.sin(th), w = halfW(n)*0.75;
          const pts = edge(w, 1).concat(edge(w, -1).reverse()).map(q => [C[0] + 0.55*(q[0]*c - q[1]*sn), C[1] + 0.55*(q[0]*sn + q[1]*c)]);
          g.fill(200, 96, 110, 58*a);
          g.beginShape(); pts.forEach(q => g.vertex(X(q[0]), Y(q[1]))); g.endShape(g.CLOSE);
        }
        g.fill(186, 78, 92, 90*a);
        g.circle(X(C[0]), Y(C[1]), X(12) - X(0));
        g.noFill(); g.stroke(150, 56, 72, 110*a); g.strokeWeight(1.2);
        g.beginShape(); spiralPath(C[0], C[1], 5.5, 0.8, 0, 1.6, 1, 40).forEach(q => g.vertex(X(q[0]), Y(q[1]))); g.endShape();
        g.noStroke();
      },
    };
  })(),

  pig: (() => {
    const curl = spiralPath(9, 22, 1.5, 6, Math.PI, 1.25, 1, 40);
    const lead = joinPaths(curl, bezPath(curl[curl.length - 1], [[[13, 17], [16, 24], [17, 31]]]));
    const F = lead[lead.length - 1];
    const top = bezPath(F, [[[16, 12], [40, 6], [62, 10]], [[72, 12], [80, 10], [85, 16]], [[89, 20], [93, 25], [96, 31]]]);
    const bottom = bezPath(F, [[[16, 50], [40, 56], [62, 52]], [[74, 50], [84, 46], [89, 41]], [[92, 38], [94, 34], [96, 31]]]);
    // the snout, then back across the face to the eye
    const snout = spiralPath(92.5, 31, 3.5, 3.5, 0, 1, 1, 30);
    const tail = joinPaths(snout, bezPath(snout[snout.length - 1], [[[90, 24], [86, 21], [81.6, 21]]]), spiralPath(80, 21, 1.6, 0.4, 0, 1.2, -1, 20));
    return {
      name: 'pig', h: 64,
      caption: 'Your chapter, folded into a pig: the walk starts at the curl of its tail, the two sides of the fork run along its back and its belly, and the last stretch goes round the snout to the eye.',
      legsFor: () => ({lead, left: top, right: bottom, tail}),
      deco(g, X, Y, a){
        g.noStroke();
        g.fill(232, 170, 160, 80*a);
        g.beginShape(); top.concat(bottom.slice().reverse()).forEach(q => g.vertex(X(q[0]), Y(q[1]))); g.endShape(g.CLOSE);
        g.fill(214, 140, 132, 90*a);
        // ear, legs, snout
        g.triangle(X(66), Y(11), X(76), Y(2), X(77), Y(14));
        [[26, 50], [36, 52], [62, 50], [72, 48]].forEach(([x, y]) => g.rect(X(x - 3), Y(y - 2), X(6) - X(0), Y(60) - Y(y - 2), 2));
        g.ellipse(X(92.5), Y(31), X(9) - X(0), Y(9) - Y(0));
        g.fill(150, 90, 90, 120*a);
        g.circle(X(91.2), Y(30), X(1.6) - X(0)); g.circle(X(93.8), Y(32), X(1.6) - X(0));
      },
    };
  })(),

  letter: (() => {
    const F = [50, 50], M = [50, 27];
    const lead = [[50, 65], [50, 50]];
    const corner = (x, y) => [x, y];
    // a letter has corners: the edges stay straight
    const left = [F, corner(3, 64), corner(3, 3), M];
    const seal = spiralPath(50, 36, 9, 2, -Math.PI/2, 1.6, 1);
    return {
      name: 'letter', h: 67,
      caption: 'Your chapter, folded into a sealed letter: the way in is the fold, the two sides of the fork run round its two edges and in along the flap, and the last stretch is pressed into the wax.',
      legsFor: () => ({lead, left, right: mirrorX(left), tail: seal}),
      deco(g, X, Y, a){
        g.noStroke();
        g.fill(240, 228, 200, 160*a);
        g.rect(X(3), Y(3), X(97) - X(3), Y(64) - Y(3), 2);
        g.noFill(); g.stroke(205, 190, 160, 160*a); g.strokeWeight(1);
        g.line(X(3), Y(3), X(50), Y(27)); g.line(X(97), Y(3), X(50), Y(27));
        g.line(X(3), Y(64), X(50), Y(50)); g.line(X(97), Y(64), X(50), Y(50));
        g.noStroke(); g.fill(178, 62, 58, 120*a);
        g.circle(X(50), Y(36), X(23) - X(0));
      },
    };
  })(),
};
const EMBLEM_FOR = {romeo: 'rose', pride: 'letter', flies: 'pig'};
