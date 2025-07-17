import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, User, Calendar, ArrowLeft, Check, X } from 'lucide-react';

const BibliotecaEscolar = () => {
  const [livros, setLivros] = useState([
    {
      id: 1,
      numero: '001',
      nome: 'Dom Casmurro',
      autor: 'Machado de Assis',
      editora: 'Ática',
      emprestado: false,
      emprestadoPara: '',
      dataEmprestimo: '',
      dataDevolucao: ''
    },
    {
      id: 2,
      numero: '002',
      nome: 'O Cortiço',
      autor: 'Aluísio Azevedo',
      editora: 'Moderna',
      emprestado: true,
      emprestadoPara: 'João Silva',
      dataEmprestimo: '2024-07-10',
      dataDevolucao: '2024-07-24'
    },
    {
      id: 3,
      numero: '003',
      nome: 'Iracema',
      autor: 'José de Alencar',
      editora: 'Saraiva',
      emprestado: false,
      emprestadoPara: '',
      dataEmprestimo: '',
      dataDevolucao: ''
    }
  ]);

  const [telaAtual, setTelaAtual] = useState('principal');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [novoLivro, setNovoLivro] = useState({
    numero: '',
    nome: '',
    autor: '',
    editora: ''
  });
  const [dadosEmprestimo, setDadosEmprestimo] = useState({
    livroId: null,
    nomeAluno: '',
    dataEmprestimo: '',
    dataDevolucao: ''
  });

  const proximoId = Math.max(...livros.map(l => l.id), 0) + 1;

  const livrosFiltrados = livros.filter(livro => {
    const termo = termoPesquisa.toLowerCase();
    return (
      livro.numero.toLowerCase().includes(termo) ||
      livro.nome.toLowerCase().includes(termo) ||
      livro.autor.toLowerCase().includes(termo) ||
      livro.editora.toLowerCase().includes(termo)
    );
  });

  const livrosDisponiveis = livros.filter(livro => !livro.emprestado);
  const livrosEmprestados = livros.filter(livro => livro.emprestado);

  const adicionarLivro = () => {
    if (novoLivro.numero && novoLivro.nome && novoLivro.autor && novoLivro.editora) {
      const livroExistente = livros.find(l => l.numero === novoLivro.numero);
      if (livroExistente) {
        alert('Já existe um livro com esse número!');
        return;
      }

      const livro = {
        id: proximoId,
        ...novoLivro,
        emprestado: false,
        emprestadoPara: '',
        dataEmprestimo: '',
        dataDevolucao: ''
      };

      setLivros([...livros, livro]);
      setNovoLivro({ numero: '', nome: '', autor: '', editora: '' });
      setTelaAtual('principal');
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  };

  const emprestarLivro = (livroId) => {
    setDadosEmprestimo({
      livroId,
      nomeAluno: '',
      dataEmprestimo: new Date().toISOString().split('T')[0],
      dataDevolucao: ''
    });
    setTelaAtual('emprestimo');
  };

  const confirmarEmprestimo = () => {
    if (dadosEmprestimo.nomeAluno && dadosEmprestimo.dataEmprestimo && dadosEmprestimo.dataDevolucao) {
      setLivros(livros.map(livro => 
        livro.id === dadosEmprestimo.livroId 
          ? {
              ...livro,
              emprestado: true,
              emprestadoPara: dadosEmprestimo.nomeAluno,
              dataEmprestimo: dadosEmprestimo.dataEmprestimo,
              dataDevolucao: dadosEmprestimo.dataDevolucao
            }
          : livro
      ));
      setTelaAtual('principal');
      setDadosEmprestimo({ livroId: null, nomeAluno: '', dataEmprestimo: '', dataDevolucao: '' });
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  };

  const devolverLivro = (livroId) => {
    setLivros(livros.map(livro => 
      livro.id === livroId 
        ? {
            ...livro,
            emprestado: false,
            emprestadoPara: '',
            dataEmprestimo: '',
            dataDevolucao: ''
          }
        : livro
    ));
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const verificarAtraso = (dataDevolucao) => {
    const hoje = new Date();
    const dataLimite = new Date(dataDevolucao);
    return hoje > dataLimite;
  };

  if (telaAtual === 'adicionar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setTelaAtual('principal')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Adicionar Novo Livro</h1>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Livro
                </label>
                <input
                  type="text"
                  value={novoLivro.numero}
                  onChange={(e) => setNovoLivro({ ...novoLivro, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Livro
                </label>
                <input
                  type="text"
                  value={novoLivro.nome}
                  onChange={(e) => setNovoLivro({ ...novoLivro, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Dom Casmurro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={novoLivro.autor}
                  onChange={(e) => setNovoLivro({ ...novoLivro, autor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Machado de Assis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editora
                </label>
                <input
                  type="text"
                  value={novoLivro.editora}
                  onChange={(e) => setNovoLivro({ ...novoLivro, editora: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Ática"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={adicionarLivro}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Adicionar Livro
                </button>
                <button
                  onClick={() => setTelaAtual('principal')}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (telaAtual === 'emprestimo') {
    const livroSelecionado = livros.find(l => l.id === dadosEmprestimo.livroId);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setTelaAtual('principal')}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Empréstimo de Livro</h1>
            </div>

            {livroSelecionado && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Livro Selecionado:</h3>
                <p className="text-blue-700">
                  <strong>#{livroSelecionado.numero}</strong> - {livroSelecionado.nome}
                </p>
                <p className="text-blue-600 text-sm">
                  {livroSelecionado.autor} | {livroSelecionado.editora}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Aluno
                </label>
                <input
                  type="text"
                  value={dadosEmprestimo.nomeAluno}
                  onChange={(e) => setDadosEmprestimo({ ...dadosEmprestimo, nomeAluno: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Empréstimo
                </label>
                <input
                  type="date"
                  value={dadosEmprestimo.dataEmprestimo}
                  onChange={(e) => setDadosEmprestimo({ ...dadosEmprestimo, dataEmprestimo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Devolução
                </label>
                <input
                  type="date"
                  value={dadosEmprestimo.dataDevolucao}
                  onChange={(e) => setDadosEmprestimo({ ...dadosEmprestimo, dataDevolucao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmarEmprestimo}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Confirmar Empréstimo
                </button>
                <button
                  onClick={() => setTelaAtual('principal')}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="text-blue-600" size={32} />
              Sistema de Biblioteca Escolar
            </h1>
            <button
              onClick={() => setTelaAtual('adicionar')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Livro
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total de Livros</p>
                  <p className="text-2xl font-bold text-blue-600">{livros.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-600">{livrosDisponiveis.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-orange-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Emprestados</p>
                  <p className="text-2xl font-bold text-orange-600">{livrosEmprestados.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por número, nome, autor ou editora..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Livros */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {livrosFiltrados.map((livro) => (
                  <tr key={livro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{livro.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livro.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livro.autor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livro.editora}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {livro.emprestado ? (
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            verificarAtraso(livro.dataDevolucao) ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {verificarAtraso(livro.dataDevolucao) ? 'Atrasado' : 'Emprestado'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Para: {livro.emprestadoPara}
                          </div>
                          <div className="text-xs text-gray-500">
                            Devolução: {formatarData(livro.dataDevolucao)}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {livro.emprestado ? (
                        <button
                          onClick={() => devolverLivro(livro.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <Check size={16} />
                          Devolver
                        </button>
                      ) : (
                        <button
                          onClick={() => emprestarLivro(livro.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <User size={16} />
                          Emprestar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {livrosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum livro encontrado para a pesquisa "{termoPesquisa}"
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotecaEscolar;
