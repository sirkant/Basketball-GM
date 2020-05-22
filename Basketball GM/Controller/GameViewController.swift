//
//  FirstViewController.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import UIKit

let nameGenerator = NameGenerator.sharedInstance
let leagueSim = LeagueSimulation.sharedInstance

class GameViewController: UIViewController {

    //MARK: - Properties
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var homeTeamLabel: UILabel!
    @IBOutlet weak var awayTeamLabel: UILabel!
    @IBOutlet weak var simulateGameButton: UIButton!
    @IBOutlet weak var viewPlayByPlayButton: UIButton!
    @IBOutlet weak var homeScore: UILabel!
    @IBOutlet weak var awayScore: UILabel!
    var gameLog : [String] = []
//    let viewPlayByPlay = UIButton(type: .roundedRect)
//    let playGame = UIButton(type: .roundedRect)
    var dataManager = OnlineDataManager()

    

    override func viewDidLoad() {
        super.viewDidLoad()
        
        dataManager.delegate = self
        getTeamInfo()
    }

    //MARK: - Actions
    @IBAction func simulateGame(_ sender: UIButton) {
        
        let team1 = makeRandomTeam()
        let team2 = makeRandomTeam()
        
        let game = Game(team1: team1, team2: team2)
        game.runGame()
        
        homeTeamLabel?.text = team1.full_name
        awayTeamLabel?.text = team2.full_name
        homeScore?.text = String(game.teamScoreOne)
        awayScore?.text = String(game.teamScoreTwo)
        
        
        for item in game.gameLog {
            gameLog.append(item)
        }
    }
    
    @IBAction func updateRostersButton(_ sender: UIButton) {
        dataManager.fetchPlayers()
    }
    
    func getTeamInfo() {
        dataManager.fetchTeams()
    }
    
    //MARK: - Play by play - Segue related methods
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "showPlayByPlay" {
            if let dVC = segue.destination as? PlayByPlayController {
                dVC.playByPlay = gameLog
            }
        }
    }
    
    
    @IBAction func viewPlayByPlayButton(_ sender: UIButton) {
         performSegue(withIdentifier: "showPlayByPlay", sender: self)
    }
}


//MARK: - OnlineDataManagerDelegate
extension GameViewController: OnlineDataManagerDelegate {
    
    
    func didUpdatePlayerData(dataManager: OnlineDataManager, playerTeamData: PlayerDataModel) {
        DispatchQueue.main.async {
//            self.temperatureLabel.text = weather.temperatureString
//            self.cityLabel.text = weather.cityName
//            self.conditionImageView.image = UIImage(systemName: weather.conditionName)
        }
    }
    
    func didUpdateTeamData(dataManager: OnlineDataManager, teamData: [Team]) {
        DispatchQueue.main.async {
            //
        }
    }
    
    func didFailWithError(error: Error) {
        print(error)
    }
    
}
