// this is a very bad way to store a set of coords.  This needs to be remade in the future.

export default function GetCoordArray(numAwards) {
  let c1 = 493;
  let c2 = 537;
  let c3 = 581;
  let c4 = 625;

  let c1Cen = 515;
  let c2Cen = 559;
  let c3Cen = 603;

  let r1 = 287;
  let r2 = 273;
  let r3 = 259;
  let r4 = 245;
  let r5 = 231;
  let r6 = 217;
  let r7 = 203;
  let r8 = 189;
  let r9 = 175;
  let r10 = 161;
  let r11 = 147;
  let r12 = 133;
  let r13 = 119;

  if (numAwards >= 35)
    throw new Error(
      "FATAL ERROR! The number of ribbons of this user exceeds the max allowable limit. This is a priority error. Inform your lead, S1 1IC and 2IC with the name of the affected user.",
    );

  /* included for use later
  {
    // -1 (On the pinboard)
    dx: 706,
    dy: 571,
  },
  {
    // -2
    dx: 750,
    dy: 571,
  },
  */

  switch (numAwards) {
    case 34:
      return [
        {
          //34
          dx: c4,
          dy: r13,
        },
        {
          //33
          dx: c3,
          dy: r12,
        },
        {
          //32
          dx: c4,
          dy: r12,
        },
        {
          //31
          dx: c3,
          dy: r11,
        },
        {
          //30
          dx: c4,
          dy: r11,
        },
        {
          //29
          dx: c3,
          dy: r10,
        },
        {
          //28
          dx: c4,
          dy: r10,
        },
        {
          //27
          dx: c3,
          dy: r9,
        },
        {
          //26
          dx: c4,
          dy: r9,
        },
        {
          //25
          dx: c3,
          dy: r8,
        },
        {
          //24
          dx: c4,
          dy: r8,
        },
        {
          //23
          dx: c3,
          dy: r7,
        },
        {
          //22
          dx: c4,
          dy: r7,
        },
        {
          //21
          dx: c2,
          dy: r6,
        },
        {
          //20
          dx: c3,
          dy: r6,
        },
        {
          //19
          dx: c4,
          dy: r6,
        },
        {
          //18
          dx: c2,
          dy: r5,
        },
        {
          //17
          dx: c3,
          dy: r5,
        },
        {
          //16
          dx: c4,
          dy: r5,
        },
        {
          //15
          dx: c2,
          dy: r4,
        },
        {
          //14
          dx: c3,
          dy: r4,
        },
        {
          //13
          dx: c1,
          dy: r3,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 33:
      return [
        {
          //33
          dx: c4,
          dy: r13,
        },
        {
          //32
          dx: c3,
          dy: r12,
        },
        {
          //31
          dx: c4,
          dy: r12,
        },
        {
          //30
          dx: c3,
          dy: r11,
        },
        {
          //29
          dx: c4,
          dy: r11,
        },
        {
          //28
          dx: c3,
          dy: r10,
        },
        {
          //27
          dx: c4,
          dy: r10,
        },
        {
          //26
          dx: c3,
          dy: r9,
        },
        {
          //25
          dx: c4,
          dy: r9,
        },
        {
          //24
          dx: c3,
          dy: r8,
        },
        {
          //23
          dx: c4,
          dy: r8,
        },
        {
          //22
          dx: c3,
          dy: r7,
        },
        {
          //21
          dx: c4,
          dy: r7,
        },
        {
          //20
          dx: c3,
          dy: r6,
        },
        {
          //19
          dx: c4,
          dy: r6,
        },
        {
          //18
          dx: c2,
          dy: r5,
        },
        {
          //17
          dx: c3,
          dy: r5,
        },
        {
          //16
          dx: c4,
          dy: r5,
        },
        {
          //15
          dx: c2,
          dy: r4,
        },
        {
          //14
          dx: c3,
          dy: r4,
        },
        {
          //13
          dx: c1,
          dy: r3,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 32:
      return [
        {
          //32
          dx: c4,
          dy: r13,
        },
        {
          //31
          dx: c3,
          dy: r12,
        },
        {
          //30
          dx: c4,
          dy: r12,
        },
        {
          //29
          dx: c3,
          dy: r11,
        },
        {
          //28
          dx: c4,
          dy: r11,
        },
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 31:
      return [
        {
          //31
          dx: c3,
          dy: r12,
        },
        {
          //30
          dx: c4,
          dy: r12,
        },
        {
          //29
          dx: c3,
          dy: r11,
        },
        {
          //28
          dx: c4,
          dy: r11,
        },
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 30:
      return [
        {
          //30
          dx: c4,
          dy: r12,
        },
        {
          //29
          dx: c3,
          dy: r11,
        },
        {
          //28
          dx: c4,
          dy: r11,
        },
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 29:
      return [
        {
          //29
          dx: c3,
          dy: r11,
        },
        {
          //28
          dx: c4,
          dy: r11,
        },
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 28:
      return [
        {
          //28
          dx: c4,
          dy: r11,
        },
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 27:
      return [
        {
          //27
          dx: c3,
          dy: r10,
        },
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 26:
      return [
        {
          //26
          dx: c4,
          dy: r10,
        },
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 25:
      return [
        {
          //25
          dx: c3,
          dy: r9,
        },
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 24:
      return [
        {
          //24
          dx: c4,
          dy: r9,
        },
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 23:
      return [
        {
          //23
          dx: c3,
          dy: r8,
        },
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 22:
      return [
        {
          //22
          dx: c4,
          dy: r8,
        },
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 21:
      return [
        {
          //21
          dx: c3,
          dy: r7,
        },
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 20:
      return [
        {
          //20
          dx: c4,
          dy: r7,
        },
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 19:
      return [
        {
          //19
          dx: c3,
          dy: r6,
        },
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 18:
      return [
        {
          //18
          dx: c4,
          dy: r6,
        },
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 17:
      return [
        {
          //17
          dx: c2,
          dy: r5,
        },
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 16:
      return [
        {
          //16
          dx: c3,
          dy: r5,
        },
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 15:
      return [
        {
          //15
          dx: c4,
          dy: r5,
        },
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 14:
      return [
        {
          //14
          dx: c2,
          dy: r4,
        },
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 13:
      return [
        {
          //13
          dx: c3,
          dy: r4,
        },
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 12:
      return [
        {
          //12
          dx: c4,
          dy: r4,
        },
        {
          //11
          dx: c2,
          dy: r3,
        },
        {
          //10
          dx: c3,
          dy: r3,
        },
        {
          //9
          dx: c4,
          dy: r3,
        },
        {
          //8
          dx: c1,
          dy: r2,
        },
        {
          //7
          dx: c2,
          dy: r2,
        },
        {
          //6
          dx: c3,
          dy: r2,
        },
        {
          //5
          dx: c4,
          dy: r2,
        },
        {
          //4
          dx: c1,
          dy: r1,
        },
        {
          //3
          dx: c2,
          dy: r1,
        },
        {
          //2
          dx: c3,
          dy: r1,
        },
        {
          //1
          dx: c4,
          dy: r1,
        },
      ];
    case 11:
      return [
        {
          //11
          dx: c2,
          dy: r4,
        },
        {
          //10
          dx: c3,
          dy: r4,
        },
        {
          //9
          dx: c1Cen,
          dy: r3,
        },
        {
          //8
          dx: c2Cen,
          dy: r3,
        },
        {
          //7
          dx: c3Cen,
          dy: r3,
        },
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 10:
      return [
        {
          //10
          dx: c2Cen,
          dy: r4,
        },
        {
          //9
          dx: c1Cen,
          dy: r3,
        },
        {
          //8
          dx: c2Cen,
          dy: r3,
        },
        {
          //7
          dx: c3Cen,
          dy: r3,
        },
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 9:
      return [
        {
          //9
          dx: c1Cen,
          dy: r3,
        },
        {
          //8
          dx: c2Cen,
          dy: r3,
        },
        {
          //7
          dx: c3Cen,
          dy: r3,
        },
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 8:
      return [
        {
          //8
          dx: c2,
          dy: r3,
        },
        {
          //7
          dx: c3,
          dy: r3,
        },
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 7:
      return [
        {
          //7
          dx: c2Cen,
          dy: r3,
        },
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 6:
      return [
        {
          //6
          dx: c1Cen,
          dy: r2,
        },
        {
          //5
          dx: c2Cen,
          dy: r2,
        },
        {
          //4
          dx: c3Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 5:
      return [
        {
          //5
          dx: c2,
          dy: r2,
        },
        {
          //4
          dx: c3,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 4:
      return [
        {
          //4
          dx: c2Cen,
          dy: r2,
        },
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 3:
      return [
        {
          //3
          dx: c1Cen,
          dy: r1,
        },
        {
          //2
          dx: c2Cen,
          dy: r1,
        },
        {
          //1
          dx: c3Cen,
          dy: r1,
        },
      ];
    case 2:
      return [
        {
          //2
          dx: c2,
          dy: r1,
        },
        {
          //1
          dx: c3,
          dy: r1,
        },
      ];
    case 1:
      return [
        {
          //1
          dx: c2Cen,
          dy: r1,
        },
      ];
    default:
      return [];
  }
}
