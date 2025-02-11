import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Settings, PlusCircle, Trash2 } from 'lucide-react';

const ExpenseTracker = () => {
  // 기본 상태 관리
  const [expenses, setExpenses] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(100); // 1엔 = 100원
  const [displayCurrency, setDisplayCurrency] = useState('KRW'); // KRW 또는 JPY
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 새 지출 입력을 위한 상태
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    payer: '석호',
    amount: '',
    currency: 'KRW',
    category: '식비',
    description: ''
  });
  
  const [settlements, setSettlements] = useState([]);

  // 상수 정의
  const members = ['석호', '남섭', '승환', '도형'];
  const categories = ['식비', '숙박', '교통', '관광', '쇼핑', '기타'];

  // 통화 변환 함수
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (fromCurrency === 'JPY' && toCurrency === 'KRW') return amount * exchangeRate;
    if (fromCurrency === 'KRW' && toCurrency === 'JPY') return amount / exchangeRate;
    return amount;
  };

  // 입력 처리 함수
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 지출 추가 함수
  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) return;
    
    const amount = parseInt(newExpense.amount.replace(/[^0-9]/g, ''), 10);
    
    setExpenses(prev => [...prev, {
      ...newExpense,
      id: Date.now(),
      amount: amount,
      amountKRW: newExpense.currency === 'JPY' ? amount * exchangeRate : amount
    }]);

    setNewExpense(prev => ({
      ...prev,
      amount: '',
      description: ''
    }));
  };

  // 금액 포맷팅 함수
  const formatCurrency = (amount) => {
    if (displayCurrency === 'JPY') {
      amount = convertCurrency(amount, 'KRW', 'JPY');
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(Math.round(amount));
    }
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(Math.round(amount));
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 통계 계산 함수
  const getTotalByPerson = () => {
    const totals = {};
    members.forEach(member => {
      totals[member] = expenses
        .filter(expense => expense.payer === member)
        .reduce((sum, expense) => sum + expense.amountKRW, 0);
    });
    return totals;
  };

  const getTotalByCategory = () => {
    const totals = {};
    categories.forEach(category => {
      totals[category] = expenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amountKRW, 0);
    });
    return totals;
  };

  // 정산 계산 함수
  const calculateSettlements = () => {
    const totalByPerson = getTotalByPerson();
    const total = Object.values(totalByPerson).reduce((sum, amount) => sum + amount, 0);
    const perPerson = total / members.length;

    const balances = {};
    members.forEach(member => {
      balances[member] = perPerson - totalByPerson[member];
    });

    const newSettlements = [];
    const payers = Object.entries(balances)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
    const receivers = Object.entries(balances)
      .filter(([_, amount]) => amount < 0)
      .sort((a, b) => a[1] - b[1]);

    let payerIdx = 0;
    let receiverIdx = 0;

    while (payerIdx < payers.length && receiverIdx < receivers.length) {
      const [payer, payAmount] = payers[payerIdx];
      const [receiver, receiveAmount] = receivers[receiverIdx];
      const amount = Math.min(payAmount, -receiveAmount);

      if (amount > 0) {
        newSettlements.push({
          from: payer,
          to: receiver,
          amount: Math.round(amount)
        });
      }

      payers[payerIdx][1] -= amount;
      receivers[receiverIdx][1] += amount;

      if (payers[payerIdx][1] < 1) payerIdx++;
      if (receivers[receiverIdx][1] > -1) receiverIdx++;
    }

    setSettlements(newSettlements);
  };

  useEffect(() => {
    calculateSettlements();
  }, [expenses, exchangeRate]);

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
                  {Object.entries(getTotalByPerson()).map(([person, amount]) => (
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