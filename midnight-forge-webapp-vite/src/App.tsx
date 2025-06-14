import './App.css';
import CreateMetadataForm from './components/CreateMetadataForm';
import WalletConnection from './components/WalletConnection';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <WalletConnection />
        <CreateMetadataForm />
      </header>
    </div>
  );
}

export default App;
