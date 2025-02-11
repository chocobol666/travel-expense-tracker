import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, PlusCircle, Trash2 } from 'lucide-react';

const ExpenseTracker = () => {
  const [exchangeRate, setExchangeRate] = useState(100);
  const [displayCurrency, setDisplayCurrency] = useState('KRW');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    payer: '석호',
    amount: '',
    currency: 'KRW',
    category: '식비',
    description: ''
  });

  const members = ['석호', '남섭', '승환', '도형'];
  const categories = ['식비', '숙박', '교통', '관광', '쇼핑', '기타'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    
    const amount = parseInt(newExpense.amount.replace(/[^0-9]/g, ''), 10);
    const amountKRW = newExpense.currency === 'JPY' ? amount * exchangeRate : amount;
    
    setExpenses(prev => [...prev, {
      ...newExpense,
      id: Date.now(),
      amount,
      amountKRW
    }]);

    setNewExpense(prev => ({
      ...prev,
      amount: '',
      description: ''
    }));
  };

  const formatCurrency = (amount, currency = displayCurrency) => {
    if (currency === 'JPY') {
      const yenAmount = displayCurrency === 'JPY' ? 
        (amount / exchangeRate) : amount;
      return `¥${Math.round(yenAmount).toLocaleString()}`;
    }
    return `₩${Math.round(amount).toLocaleString()}`;
  };

  const calculateTotalByPerson = () => {
    const totals = {};
    members.forEach(member => {
      totals[member] = expenses
        .filter(exp => exp.payer === member)
        .reduce((sum, exp) => sum + exp.amountKRW, 0);
    });
    return totals;
  };

  const calculateSettlements = () => {
    const totalByPerson = calculateTotalByPerson();
    const totalExpense = Object.values(totalByPerson).reduce((a, b) => a + b, 0);
    const averagePerPerson = totalExpense / members.length;
    
    const settlements = [];
    const balances = members.map(member => ({
      name: member,
      balance: averagePerPerson - totalByPerson[member]
    }));

    const payers = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const receivers = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

    while (payers.length > 0 && receivers.length > 0) {
      const payer = payers[0];
      const receiver = receivers[0];
      const amount = Math.min(payer.balance, -receiver.balance);

      settlements.push({
        from: payer.name,
        to: receiver.name,
        amount
      });

      payer.balance -= amount;
      receiver.balance += amount;

      if (Math.abs(payer.balance) < 1) payers.shift();
      if (Math.abs(receiver.balance) < 1) receivers.shift();
    }

    return settlements;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">여행 경비 정산기</CardTitle>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        
        {isSettingsOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">환율 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">표시 통화</label>
                <select 
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="KRW">한국 원화 (₩)</option>
                  <option value="JPY">일본 엔화 (¥)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">1엔 = X원</label>
                <input 
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 새 지출 입력 폼 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">새 지출 입력</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">날짜</label>
              <input
                type="date"
                name="date"
                value={newExpense.date}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">결제자</label>
              <select
                name="payer"
                value={newExpense.payer}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              >
                {members.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">금액</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full border rounded px-3 py-2"
                />
                <select
                  name="currency"
                  value={newExpense.currency}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                >
                  <option value="KRW">₩</option>
                  <option value="JPY">¥</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">카테고리</label>
              <select
                name="category"
                value={newExpense.category}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">내용</label>
              <input
                type="text"
                name="description"
                value={newExpense.description}
                onChange={handleInputChange}
                placeholder="지출 내용을 입력하세요"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={handleAddExpense}
            className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            추가하기
          </button>
        </div>

        {/* 지출 내역 목록 */}
        {expenses.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">지출 내역</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">날짜</th>
                    <th className="px-4 py-2 text-left">결제자</th>
                    <th className="px-4 py-2 text-left">카테고리</th>
                    <th className="px-4 py-2 text-left">내용</th>
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b">
                      <td className="px-4 py-2">{expense.date}</td>
                      <td className="px-4 py-2">{expense.payer}</td>
                      <td className="px-4 py-2">{expense.category}</td>
                      <td className="px-4 py-2">{expense.description}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => setExpenses(prev => 
                            prev.filter(e => e.id !== expense.id)
                          )}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 정산 내역 */}
        {expenses.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 인당 사용 금액 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">인당 사용 금액</h3>
                <div className="space-y-2">
                  {Object.entries(calculateTotalByPerson()).map(([person, amount]) => (
                    <div key={person} className="flex justify-between">
                      <span>{person}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 총 정산 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">총 정산 정보</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>총 지출</span>
                    <span className="font-medium">
                      {formatCurrency(
                        expenses.reduce((sum, exp) => sum + exp.amountKRW, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>1인당 금액</span>
                    <span className="font-medium">
                      {formatCurrency(
                        expenses.reduce((sum, exp) => sum + exp.amountKRW, 0) / members.length
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 송금 내역 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">정산 내역</h3>
              <div className="space-y-2">
                {calculateSettlements().map((settlement, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                    <span className="font-medium">{settlement.from}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{settlement.to}</span>
                    <span className="ml-4 text-blue-600 font-semibold">
                      {formatCurrency(settlement.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseTracker;