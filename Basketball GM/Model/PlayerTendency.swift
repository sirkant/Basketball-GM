//
//  PlayerTendency.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-12.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class PlayerTendency {
    
    //Offensive tendencies
    var shootInsideTendency : Range<Int>
    var shootThreePointTendency : Range<Int>
    var passBallTendency : Range<Int>
    
    //Defensive tendencies
    var stealTendency : Range<Int>
    var blockTendency : Range<Int>
    var foulTendency : Range<Int>
    
    init(tendencyType : String) {
        if tendencyType == K.sharpshooter {
            shootInsideTendency = 0..<10
            shootThreePointTendency = 10..<70
            passBallTendency = 70..<100
            
            stealTendency = 0 ..< 30
            blockTendency = 30 ..< 60
            foulTendency = 60 ..< 80
        } else if tendencyType == K.insideScorer {
            shootInsideTendency = 0..<60
            shootThreePointTendency = 60..<70
            passBallTendency = 70..<100
            
            stealTendency = 0 ..< 30
            blockTendency = 30 ..< 60
            foulTendency = 60 ..< 80
        } else if tendencyType == K.lockdownDefender {
            shootInsideTendency = 0..<10
            shootThreePointTendency = 10..<20
            passBallTendency = 20..<100
            
            stealTendency = 0 ..< 40
            blockTendency = 40 ..< 70
            foulTendency = 70 ..< 80
        } else {
            shootInsideTendency = 0..<20
            shootThreePointTendency = 20..<40
            passBallTendency = 40..<100
            
            stealTendency = 0 ..< 30
            blockTendency = 30 ..< 50
            foulTendency = 50 ..< 70
        }
    }
    
    func getOffensiveAction() -> String {
        let randomNum = Int.random(in: 0 ... 100)
        
        if shootInsideTendency.contains(randomNum) {
            return K.shootInside
        } else if shootThreePointTendency.contains(randomNum) {
            return K.shoot3pt
        } else {
            return K.pass
        }
    }
    
    func getDefensiveAction() -> String {
        let randomNum = Int.random(in: 0 ... 100)
        
        if stealTendency.contains(randomNum) {
            return K.steal
        } else if blockTendency.contains(randomNum) {
            return K.block
        } else if foulTendency.contains(randomNum) {
            return K.foul
        } else {
            return K.normalDefense
        }
    }
}


