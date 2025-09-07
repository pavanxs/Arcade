// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ArcadeGames {
    struct Game {
        uint256 id;
        string question;
        bytes32 answerHash; // Hash of the correct answer
        uint256 entryFee;
        uint256 prizePool;
        address[] participants;
        address winner;
        bool isActive;
        bool isCompleted;
        uint256 createdAt;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => bytes32)) public submittedAnswers; // Store hashed answers
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;

    uint256 public gameCount;
    address public owner;

    event GameCreated(uint256 indexed gameId, string question, uint256 entryFee);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 amount);
    event AnswerSubmitted(uint256 indexed gameId, address indexed player);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 prizeAmount);
    event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier gameExists(uint256 _gameId) {
        require(_gameId > 0 && _gameId <= gameCount, "Game does not exist");
        _;
    }

    modifier gameActive(uint256 _gameId) {
        require(games[_gameId].isActive, "Game is not active");
        _;
    }

    modifier notCompleted(uint256 _gameId) {
        require(!games[_gameId].isCompleted, "Game is already completed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Create a new game with question and answer hash
    function createGame(
        string memory _question,
        string memory _answer,
        uint256 _entryFee
    ) external onlyOwner returns (uint256) {
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(bytes(_answer).length > 0, "Answer cannot be empty");
        require(_entryFee > 0, "Entry fee must be greater than 0");

        gameCount++;
        bytes32 answerHash = keccak256(abi.encodePacked(_answer));

        games[gameCount] = Game({
            id: gameCount,
            question: _question,
            answerHash: answerHash,
            entryFee: _entryFee,
            prizePool: 0,
            participants: new address[](0),
            winner: address(0),
            isActive: true,
            isCompleted: false,
            createdAt: block.timestamp
        });

        emit GameCreated(gameCount, _question, _entryFee);
        return gameCount;
    }

    // Join a game by paying the entry fee
    function joinGame(uint256 _gameId)
        external
        payable
        gameExists(_gameId)
        gameActive(_gameId)
        notCompleted(_gameId)
    {
        Game storage game = games[_gameId];
        require(msg.value >= game.entryFee, "Entry fee too low");
        require(!hasJoined[_gameId][msg.sender], "Already joined this game");

        hasJoined[_gameId][msg.sender] = true;
        game.participants.push(msg.sender);
        game.prizePool += game.entryFee; // Only add the required entry fee to prize pool

        // Refund excess payment
        if (msg.value > game.entryFee) {
            uint256 excess = msg.value - game.entryFee;
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }

        emit PlayerJoined(_gameId, msg.sender, game.entryFee);
    }

    // Submit answer (stored as hash for privacy)
    function submitAnswer(uint256 _gameId, string memory _answer)
        external
        gameExists(_gameId)
        gameActive(_gameId)
        notCompleted(_gameId)
    {
        require(hasJoined[_gameId][msg.sender], "Must join game first");
        require(!hasSubmitted[_gameId][msg.sender], "Already submitted answer");

        bytes32 answerHash = keccak256(abi.encodePacked(_answer));
        submittedAnswers[_gameId][msg.sender] = answerHash;
        hasSubmitted[_gameId][msg.sender] = true;

        emit AnswerSubmitted(_gameId, msg.sender);
    }

    // Verify answer and complete game (only owner can call this to prevent spam)
    function verifyAndCompleteGame(uint256 _gameId)
        external
        onlyOwner
        gameExists(_gameId)
        gameActive(_gameId)
        notCompleted(_gameId)
    {
        Game storage game = games[_gameId];
        address winner = address(0);

        // Find the first (oldest) participant with correct answer
        for (uint256 i = 0; i < game.participants.length; i++) {
            address participant = game.participants[i];
            if (hasSubmitted[_gameId][participant] &&
                submittedAnswers[_gameId][participant] == game.answerHash) {
                winner = participant;
                break; // First correct answer wins
            }
        }

        game.isActive = false;
        game.isCompleted = true;

        if (winner != address(0)) {
            // Someone won - declare winner and emit event
            game.winner = winner;
            emit GameCompleted(_gameId, winner, game.prizePool);
        } else {
            // No correct answers - refund all participants
            refundAllParticipants(_gameId);
            emit GameCompleted(_gameId, address(0), 0); // Winner is address(0) for no winner
        }
    }

    // Internal function to refund all participants
    function refundAllParticipants(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        uint256 refundAmount = game.entryFee;

        for (uint256 i = 0; i < game.participants.length; i++) {
            address participant = game.participants[i];
            (bool success, ) = payable(participant).call{value: refundAmount}("");
            require(success, "Refund failed for participant");
        }

        // Reset prize pool after refunds
        game.prizePool = 0;
    }

    // Winner can claim their prize
    function claimPrize(uint256 _gameId)
        external
        gameExists(_gameId)
    {
        Game storage game = games[_gameId];
        require(game.isCompleted, "Game is not completed yet");
        require(game.winner == msg.sender, "Only winner can claim prize");
        require(game.prizePool > 0, "No prize to claim");

        uint256 prizeAmount = game.prizePool;
        game.prizePool = 0; // Prevent re-entrancy

        (bool success, ) = payable(msg.sender).call{value: prizeAmount}("");
        require(success, "Prize transfer failed");

        emit PrizeClaimed(_gameId, msg.sender, prizeAmount);
    }

    // View functions
    function getGame(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (
            string memory question,
            uint256 entryFee,
            uint256 prizePool,
            address[] memory participants,
            address winner,
            bool isActive,
            bool isCompleted
        )
    {
        Game storage game = games[_gameId];
        return (
            game.question,
            game.entryFee,
            game.prizePool,
            game.participants,
            game.winner,
            game.isActive,
            game.isCompleted
        );
    }

    function getParticipants(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (address[] memory)
    {
        return games[_gameId].participants;
    }

    function hasPlayerJoined(uint256 _gameId, address _player)
        external
        view
        returns (bool)
    {
        return hasJoined[_gameId][_player];
    }

    function hasPlayerSubmitted(uint256 _gameId, address _player)
        external
        view
        returns (bool)
    {
        return hasSubmitted[_gameId][_player];
    }

    function getLatestGameId() external view returns (uint256) {
        return gameCount;
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // Function to get contract balance
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
