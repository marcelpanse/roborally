class @Area
  @start:
    simple: () ->
      @addWall  2, 0, 'up'
      @addWall  4, 0, 'up'
      @addWall  7, 0, 'up'
      @addWall  9, 0, 'up'
      @addWall  1, 2, 'left'
      @addWall  3, 2, 'left'
      @addWall  5, 2, 'left'
      @addWall  6, 2, 'left'
      @addWall  8, 2, 'left'
      @addWall 10, 2, 'left'
      @addWall 11, 2, 'left'
      @addWall  2, 3, 'down'
      @addWall  4, 3, 'down'
      @addWall  7, 3, 'down'
      @addWall  9, 3, 'down'

      @addStart  5, 2, 'up'
      @addStart  6, 2, 'up'
      @addStart  3, 2, 'up'
      @addStart  8, 2, 'up'
      @addStart  1, 2, 'up'
      @addStart 10, 2, 'up'
      @addStart  0, 2, 'up'
      @addStart 11, 2, 'up'

    roller: () ->
      @setRoller  0, 2, 'rrdrrr'
      @setRoller 11, 2, 'lldlll'

      @addWall 2, 0, 'up'
      @addWall 4, 0, 'up'
      @addWall 7, 0, 'up'
      @addWall 9, 0, 'up'
      @addWall 4, 0, 'left'
      @addWall 7, 0, 'right'

      @addWall  1, 1, 'left'
      @addWall  2, 1, 'left'
      @addWall 10, 1, 'left'
      @addWall 11, 1, 'left'
      @addWall  8, 2, 'left'
      @addWall  6, 2, 'left'
      @addWall  6, 3, 'left'

      @addStart  5, 3, 'up'
      @addStart  6, 3, 'up'
      @addStart  3, 2, 'up'
      @addStart  8, 2, 'up'
      @addStart  1, 1, 'up'
      @addStart 10, 1, 'up'
      @addStart  0, 0, 'up'
      @addStart 11, 0, 'up'

  @course:
    default: () ->
      @setVoid 9, 2
      @setVoid 1, 4
      @setVoid 2, 4
      @setVoid 5, 4
      @setVoid 4, 5
      @setVoid 5, 5
      @setVoid 6, 5
      @setVoid 5, 6
      @setVoid 9, 8
      @setVoid 2,10
      @setVoid 0,11
  
      @setRoller  1, 0, 'drrrrddldldllll'
      @setRoller  5, 0, 'dd'
      @setRoller 11, 1, 'luu'
      @setRoller 11, 5, 'lllluluuuuu'
      @setRoller  0, 6, 'rrrrdrddddd'
      @setRoller  0,10, 'rdd'
      @setRoller 10,11, 'ulllluuuurrrrrr'
      @setRoller  6,11, 'uu'
  
      @setRepair 11, 0
      @setRepair  0, 9
  
      @setOption  2, 3
      @setOption  9, 7
  
      @addWall  2, 0, 'up'
      @addWall  7, 0, 'up'
      @addWall  9, 0, 'up'
      @addWall  0, 2, 'left'
      @addWall 11, 2, 'right'
      @addWall  1, 3, 'right-down'
      @addWall  3, 3, 'right'
      @addWall  7, 3, 'left-down'
      @addWall  0, 4, 'left'
      @addWall  9, 4, 'down'
      @addWall 11, 4, 'right'
      @addWall  0, 7, 'left-down'
      @addWall  7, 7, 'left-up'
      @addWall 10, 7, 'up'
      @addWall 11, 7, 'right'
      @addWall  4, 8, 'up'
      @addWall  0, 9, 'left'
      @addWall  2, 9, 'right'
      @addWall  9,11, 'right'
      @addWall  2,11, 'down'
      @addWall  4,11, 'down'
      @addWall  7,11, 'right-down'
      @addWall  9,11, 'down'
  
      @addLaser 4, 0, 'd', 3
      @addLaser 2, 8, 'r', 2
      @addLaser 7, 8, 'r', 2
  
      @addDoubleLaser 8, 1, 'd', 3

    vault: () ->
      @setVoid  2, 3
      @setVoid  9, 3
      @setVoid  2, 8
      @setVoid  9, 8

      @setRoller 1, 0, 'dll'
      @setRoller 3, 0, 'u'
      @setRoller 9, 0, 'ldlllll'
      @setRoller 8, 0, 'd'
      @setRoller 0, 6, 'rddddrrrrdd'
      @setRoller 8,10, 'rrrr'

      @setExpressRoller  10, 1,'ddrr'
      @setExpressRoller  10, 6,'rr'

      @setRepair  0,11
      @setRepair 11, 0

      @setOption  5, 5
      @setOption  5, 6
      @setOption  6, 5
      @setOption  6, 6

      @setGear  3, 1, 'cw'
      @setGear 10, 0, 'cw'

      @setPusher  5, 2, 'up', 'odd'
      @setPusher 10, 5, 'down', 'even'
      @setPusher  2, 6, 'left', 'odd'
      @setPusher  9, 6, 'right', 'odd'
      @setPusher  5, 9, 'down', 'even'
      @setPusher  6, 9, 'down', 'odd'

      @addWall  2, 0, 'up'
      @addWall  9, 0, 'up'
      @addWall  6, 2, 'down'
      @addWall 11, 2, 'right'
      @addWall  0 ,4, 'left'
      @addWall  4, 4, 'left'
      @addWall  7, 4, 'right'
      @addWall 11, 4, 'right'
      @addWall  2, 5, 'right'
      @addWall  9, 5, 'left'
      @addWall  0, 7, 'left'
      @addWall  3, 7, 'left'
      @addWall  7, 7, 'right'
      @addWall 11, 7, 'right'
      @addWall  0, 9, 'left'
      @addWall 11, 9, 'right'
      @addWall  2,11, 'down'
      @addWall  9,11, 'down'

      @addLaser 4, 0, 'd', 4
      @addLaser 7, 0, 'd', 4
      @addLaser 0, 2, 'r', 4
      @addLaser 4, 8, 'd', 4
      @addLaser 7, 8, 'd', 4

