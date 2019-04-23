pragma solidity >=0.0.0;

contract BasicContract {
  int s_amount;
  address s_owner;
  
  constructor() public {
      s_owner = msg.sender;
      s_amount = 0;
  }
  
  modifier onlyOwner() {
    require(msg.sender == s_owner);
        _;
  }

  function deposit(int v) public  {
    require(v >= 0);
    s_amount = s_amount + v;
  }
  
  function withdraw(int v) public onlyOwner {
      require(v >= 0);
      require(s_amount >= v);
      s_amount = s_amount - v;
  }

  function getBalance() constant public returns (int retVal) {
      return s_amount;
  }

  function getAddress() constant public returns (address a) {
      return s_owner; 
  }
}
