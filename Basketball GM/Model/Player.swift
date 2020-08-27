//
//  Player.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation
import RealmSwift

class Player {
    @objc dynamic var name : String
    dynamic var playerTendency = PlayerTendency(tendencyType: "")
    
    //MARK: - Offensive stats
    
    //Shooting
    @objc dynamic var insideScoring : Int
    @objc dynamic var midRangeScoring : Int
    @objc dynamic var threePointShot : Int
    @objc dynamic var freeThrows : Int
    
    //Passing
    @objc dynamic var passing : Int
    @objc dynamic var oIQ : Int
    
    //Other
    @objc dynamic var handles : Int
    @objc dynamic var rebounding : Int
    @objc dynamic var screenSetting : Int
    
    //MARK: - Defensive stats
    @objc dynamic var dIQ : Int
    @objc dynamic var defReb: Int
    @objc dynamic var positioning : Int
    @objc dynamic var steals : Int
    @objc dynamic var blocks : Int
    
    //Physical stats
    @objc dynamic var reach : Int
    @objc dynamic var stamina : Int
    @objc dynamic var strength : Int
    @objc dynamic var basketballMotor : Int
    @objc dynamic var injuryProne : Int
    
    //MARK: - Mental stats
    @objc dynamic var creativity : Int
    @objc dynamic var determination : Int
    @objc dynamic var profesionalism : Int
    @objc dynamic var potential : Int
    @objc dynamic var offCourtAwareness : Int
    @objc dynamic var defCourtAwareness : Int
    
    
    init(playerType: String) {
        if playerType == K.sharpshooter {
            //Shooting
            insideScoring = 50
            midRangeScoring = 48
            threePointShot = 41
            freeThrows = 88
            
            passing = 40
            oIQ = 40
            
            handles = 50
            rebounding = 30
            screenSetting = 10
            
            //Defensive stats
            dIQ = 40
            defReb = 30
            positioning = 35
            steals = 40
            blocks = 40
            
            //Physical stats
            reach = 40
            stamina = 60
            strength = 40
            basketballMotor = 60
            injuryProne = 50
            
            //Mental stats
            creativity = 30
            determination = 40
            profesionalism = 45
            potential = 50
            offCourtAwareness = 60
            defCourtAwareness = 30
        } else if playerType == K.insideScorer {
            //Shooting
            insideScoring = 60
            midRangeScoring = 45
            threePointShot = 30
            freeThrows = 65
            
            passing = 50
            oIQ = 40
            
            handles = 40
            rebounding = 60
            screenSetting = 70
            
            //Defensive stats
            dIQ = 60
            defReb = 70
            positioning = 65
            steals = 10
            blocks = 60
            
            //Physical stats
            reach = 60
            stamina = 50
            strength = 60
            basketballMotor = 30
            injuryProne = 50
            
            //Mental stats
            creativity = 30
            determination = 40
            profesionalism = 45
            potential = 50
            offCourtAwareness = 60
            defCourtAwareness = 30
        } else if playerType == K.lockdownDefender {
            //Shooting
            insideScoring = 40
            midRangeScoring = 45
            threePointShot = 36
            freeThrows = 70
            
            passing = 40
            oIQ = 30
            
            handles = 50
            rebounding = 50
            screenSetting = 10
            
            //Defensive stats
            dIQ = 70
            defReb = 40
            positioning = 85
            steals = 60
            blocks = 60
            
            //Physical stats
            reach = 50
            stamina = 70
            strength = 60
            basketballMotor = 70
            injuryProne = 50
            
            //Mental stats
            creativity = 30
            determination = 70
            profesionalism = 45
            potential = 50
            offCourtAwareness = 30
            defCourtAwareness = 60
        } else {
            //Shooting
            insideScoring = 50
            midRangeScoring = 45
            threePointShot = 35
            freeThrows = 80
            
            passing = 50
            oIQ = 50
            
            handles = 50
            rebounding = 50
            screenSetting = 30
            
            //Defensive stats
            dIQ = 50
            defReb = 50
            positioning = 50
            steals = 40
            blocks = 40
            
            //Physical stats
            reach = 50
            stamina = 50
            strength = 50
            basketballMotor = 50
            injuryProne = 50
            
            //Mental stats
            creativity = 50
            determination = 50
            profesionalism = 50
            potential = 50
            offCourtAwareness = 50
            defCourtAwareness = 50
        }
        playerTendency = PlayerTendency(tendencyType: playerType)
        name = NameGenerator.sharedInstance.pickRandomPlayerNames()
    }
    
    
    func getOffenseMoveAndRating() -> (String, Int) {
        if playerTendency.getOffensiveAction() == K.shootInside {
            let randomRating = Int.random(in: 0 ... insideScoring)
            return (K.shootInside, randomRating)
        } else if playerTendency.getOffensiveAction() == K.shoot3pt {
            let randomRating = Int.random(in: 0 ... threePointShot)
            return (K.shoot3pt, randomRating)
        } else if playerTendency.getOffensiveAction() == K.pass {
            let randomRating = Int.random(in: 0 ... passing)
            return (K.pass, randomRating)
        }
        return ("no action", 0)
    }
    
    func getDefensiveMoveAndRating(offensiveMove: String) -> (String, Int) {
        if offensiveMove == K.shootInside {
            let randomRating = Int.random(in: 0 ... (defReb + positioning + blocks + defCourtAwareness + dIQ)/5)
            return (K.insideDef, randomRating)
        } else if offensiveMove == K.shoot3pt {
            let randomRating = Int.random(in: 0 ... (dIQ + positioning + reach + defCourtAwareness) / 4)
            return (K.perimeterDef, randomRating)
        } else if offensiveMove == K.pass {
            let randomRating = Int.random(in: 0 ... (defCourtAwareness + steals + reach) / 4)
            return (K.steal, randomRating)
        }
        return ("no action", 0 )
    }
}

func makeRandomPlayer() -> Player {
    let type = [K.sharpshooter, K.insideScorer,K.lockdownDefender,K.rolePlayer].randomElement()
    return Player(playerType: type!)
}


