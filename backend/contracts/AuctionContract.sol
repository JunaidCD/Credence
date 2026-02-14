// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuctionContract
 * @dev Dutch auction for credential premium services
 */
contract AuctionContract {
    // Auction struct
    struct Auction {
        uint256 id;
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool hasEnded;
        uint256 bidCount;
        string itemDescription;
        address[] bidders;
    }
    
    // Bid struct
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool isRefunded;
    }
    
    // Storage
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256[]) public userAuctions;
    mapping(address => uint256[]) public userBids;
    
    // Configuration
    address public owner;
    uint256 public auctionCount;
    uint256 public platformFeePercent = 25;
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event BidRefunded(uint256 indexed auctionId, address indexed bidder);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Auction: caller is not owner");
        _;
    }

    modifier auctionExists(uint256 _auctionId) {
        require(auctions[_auctionId].seller != address(0) || _auctionId <= auctionCount, 
            "Auction: does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Create auction
    function createAuction(
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _duration,
        string memory _description
    ) external returns (uint256) {
        require(_startPrice > 0, "Auction: start price must be > 0");
        require(_endPrice > 0 && _endPrice < _startPrice, "Auction: invalid end price");
        require(_duration >= MIN_AUCTION_DURATION, "Auction: duration too short");
        require(_duration <= MAX_AUCTION_DURATION, "Auction: duration too long");
        
        uint256 auctionId = ++auctionCount;
        
        auctions[auctionId] = Auction({
            id: auctionId,
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            startPrice: _startPrice,
            endPrice: _endPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: true,
            hasEnded: false,
            bidCount: 0,
            itemDescription: _description
        });
        
        userAuctions[msg.sender].push(auctionId);
        
        emit AuctionCreated(auctionId, msg.sender, _startPrice, _endPrice, _duration);
        
        return auctionId;
    }

    // Place bid
    function placeBid(uint256 _auctionId) 
        external payable auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.isActive, "Auction: not active");
        require(block.timestamp < auction.endTime, "Auction: ended");
        require(msg.value > auction.highestBid, "Auction: bid too low");
        
        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        auction.bidCount++;
        
        auctionBids[_auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            isRefunded: false
        }));
        
        userBids[msg.sender].push(_auctionId);
        
        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    // End auction
    function endAuction(uint256 _auctionId) 
        external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.isActive, "Auction: not active");
        require(
            block.timestamp >= auction.endTime || 
            msg.sender == auction.seller ||
            msg.sender == owner,
            "Auction: cannot end yet"
        );
        
        auction.isActive = false;
        auction.hasEnded = true;
        
        if (auction.highestBidder != address(0)) {
            uint256 fee = (auction.highestBid * platformFeePercent) / FEE_DENOMINATOR;
            uint256 sellerAmount = auction.highestBid - fee;
            
            payable(auction.seller).transfer(sellerAmount);
            
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    // Cancel auction
    function cancelAuction(uint256 _auctionId) 
        external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        
        require(msg.sender == auction.seller || msg.sender == owner, 
            "Auction: not authorized");
        require(auction.isActive, "Auction: already ended");
        require(auction.bidCount == 0, "Auction: has bids");
        
        auction.isActive = false;
        
        emit AuctionCancelled(_auctionId);
    }

    // Get auction
    function getAuction(uint256 _auctionId) 
        external view returns (Auction memory) {
        return auctions[_auctionId];
    }

    // Get auction bids
    function getAuctionBids(uint256 _auctionId) 
        external view returns (Bid[] memory) {
        return auctionBids[_auctionId];
    }

    // Get user auctions
    function getUserAuctions(address _user) 
        external view returns (uint256[] memory) {
        return userAuctions[_user];
    }

    // Get user bids
    function getUserBids(address _user) 
        external view returns (uint256[] memory) {
        return userBids[_user];
    }

    // Get current price
    function getCurrentPrice(uint256 _auctionId) 
        external view returns (uint256) {
        Auction storage auction = auctions[_auctionId];
        
        if (!auction.isActive) return auction.highestBid;
        
        uint256 timeElapsed = block.timestamp - auction.startTime;
        uint256 totalDuration = auction.endTime - auction.startTime;
        
        if (timeElapsed >= totalDuration) {
            return auction.endPrice;
        }
        
        uint256 priceDrop = ((auction.startPrice - auction.endPrice) * timeElapsed) / totalDuration;
        return auction.startPrice - priceDrop;
    }

    // Get auction count
    function getAuctionCount() 
        external view returns (uint256) {
        return auctionCount;
    }

    // Get bid count
    function getBidCount(uint256 _auctionId) 
        external view returns (uint256) {
        return auctions[_auctionId].bidCount;
    }

    // Get active auctions
    function getActiveAuctions() 
        external view returns (uint256[] memory) {
        uint256[] memory active = new uint256[](auctionCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (auctions[i].isActive) {
                active[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }
        
        return result;
    }

    // Get ended auctions
    function getEndedAuctions() 
        external view returns (uint256[] memory) {
        uint256[] memory ended = new uint256[](auctionCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= auctionCount; i++) {
            if (auctions[i].hasEnded) {
                ended[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = ended[i];
        }
        
        return result;
    }

    // Update platform fee
    function updatePlatformFee(uint256 _newFee) 
        external onlyOwner {
        require(_newFee <= 100, "Auction: fee too high");
        platformFeePercent = _newFee;
    }

    // Extend auction
    function extendAuction(uint256 _auctionId, uint256 _additionalTime) 
        external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        
        require(msg.sender == auction.seller || msg.sender == owner, 
            "Auction: not authorized");
        require(auction.isActive, "Auction: not active");
        
        auction.endTime += _additionalTime;
    }

    // Get time remaining
    function getTimeRemaining(uint256 _auctionId) 
        external view returns (uint256) {
        Auction storage auction = auctions[_auctionId];
        
        if (block.timestamp >= auction.endTime) {
            return 0;
        }
        
        return auction.endTime - block.timestamp;
    }

    // Is auction active
    function isAuctionActive(uint256 _auctionId) 
        external view returns (bool) {
        return auctions[_auctionId].isActive;
    }

    // Receive ETH
    receive() external payable {}
}
