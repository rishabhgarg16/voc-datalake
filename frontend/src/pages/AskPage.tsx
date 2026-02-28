import AskCustomers from '../components/AskCustomers';

export default function AskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Ask Your Customers</h2>
        <p className="text-sm text-gray-400">
          Get AI-powered answers from your customer data with cited quotes
        </p>
      </div>

      <AskCustomers />
    </div>
  );
}
