pragma solidity >=0.0.0;

contract SethContract {
  int s_amount;
  address s_owner;
  
  constructor() public {
      s_owner = msg.sender;
      s_amount = 0;
  }
  
  function deposit(int v) public  {
    require(v >= 0);
    s_amount = s_amount + v;
  }
  
  function withdraw(int v) public {
      require(v >= 0);
      require(s_amount >= v);
      s_amount = s_amount - v;
  }

 function reset(int v) public {
      require(v >= 0);
      s_amount = v;
  }

  function getBalance(int v) constant public returns (string retVal) {
      return int2str(s_amount);
  }

  function getAddress(int v) constant public returns (address a) {
      return s_owner; 
  }

  function int2str(int i) internal pure returns (string) {
    if (i == 0) return "0";
    int j = i;
    uint length;
    while (j != 0){
        length++;
        j /= 10;
    }
    bytes memory bstr = new bytes(length);
    uint k = length - 1;
    while (i != 0){
        bstr[k--] = byte(48 + i % 10);
        i /= 10;
    }
    return string(bstr);
  }
}
