import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, User, Calendar, ArrowLeft, Check, X, Download, Upload, FileText, Database } from 'lucide-react';
import './App.css';

// Configuração do IndexedDB
const DB_NAME = 'BibliotecaEscolar';
const DB_VERSION = 2;
const STORE_NAME = 'livros';

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('numero', 'numero', { unique: true });
                    store.createIndex('nome', 'nome', { unique: false });
                    store.createIndex('autor', 'autor', { unique: false });
                    store.createIndex('editora', 'editora', { unique: false });
                }
            };
        });
    }

    async getAllLivros() {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async addLivro(livro) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(livro);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async updateLivro(livro) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(livro);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async deleteLivro(id) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getLivroByNumero(numero) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('numero');
            const request = index.get(numero);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async clearDatabase() {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async initializeWithSampleData() {
        const livros = await this.getAllLivros();

        if (livros.length === 0) {
            const sampleData = [{
                    id: 1,
                    numero: '4139',
                    nome: 'As Aventuras de Ripió Lacraia',
                    autor: 'Chico de Assis',
                    editora: 'Scipione',
                    emprestado: false,
                    emprestadoPara: '',
                    dataEmprestimo: '',
                    dataDevolucao: ''
                },
                {
                    id: 2,
                    numero: '9219',
                    nome: 'Dom Casmurro',
                    autor: 'Machado de Assis',
                    editora: 'Ciranda Cultural',
                    emprestado: false,
                    emprestadoPara: '',
                    dataEmprestimo: '',
                    dataDevolucao: ''
                },
                {
                    id: 3,
                    numero: '3260',
                    nome: 'Encontros Cósmicos',
                    autor: 'R. G. Austin',
                    editora: 'Saraiva',
                    emprestado: false,
                    emprestadoPara: '',
                    dataEmprestimo: '',
                    dataDevolucao: ''
                }
            ];

            for (const livro of sampleData) {
                await this.addLivro(livro);
            }
        }
    }
}

const BibliotecaEscolar = () => {
    const [livros, setLivros] = useState([]);
    const [telaAtual, setTelaAtual] = useState('principal');
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [dbManager] = useState(new DatabaseManager());
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
    const [status, setStatus] = useState({ message: '', type: '' });

    // Funções utilitárias - movidas para o topo antes dos filtros
    const formatarData = (data) => {
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const verificarAtraso = (dataDevolucao) => {
        const hoje = new Date();
        const dataLimite = new Date(dataDevolucao);
        return hoje > dataLimite;
    };

    const proximoId = () => {
        const ids = livros.map(l => l.id);
        return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    };

    // Inicializar o banco de dados e carregar os livros
    useEffect(() => {
        const initializeDB = async() => {
            try {
                await dbManager.initDB();
                await dbManager.initializeWithSampleData();
                await carregarLivros();
            } catch (error) {
                console.error('Erro ao inicializar banco de dados:', error);
                showStatus('Erro ao carregar o banco de dados. Verifique se o navegador suporta IndexedDB.', 'error');
            } finally {
                setCarregando(false);
            }
        };

        initializeDB();
    }, []);

    const showStatus = (message, type = 'info') => {
        setStatus({ message, type });
        setTimeout(() => {
            setStatus({ message: '', type: '' });
        }, 5000);
    };

    const carregarLivros = async() => {
        try {
            const livrosDB = await dbManager.getAllLivros();
            setLivros(livrosDB);
        } catch (error) {
            console.error('Erro ao carregar livros:', error);
            showStatus('Erro ao carregar os livros do banco de dados.', 'error');
        }
    };

    // FUNÇÕES DE EXPORTAÇÃO
    const exportarParaJSON = async() => {
        try {
            const data = await dbManager.getAllLivros();

            if (data.length === 0) {
                showStatus('Não há dados para exportar!', 'error');
                return;
            }

            const exportData = {
                exportDate: new Date().toISOString(),
                databaseName: DB_NAME,
                storeName: STORE_NAME,
                totalRecords: data.length,
                data: data
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `biblioteca_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            showStatus(`Exportação JSON concluída! ${data.length} livros exportados.`, 'success');

        } catch (error) {
            console.error('Erro na exportação JSON:', error);
            showStatus('Erro ao exportar dados para JSON.', 'error');
        }
    };

    const exportarParaCSV = async() => {
        try {
            const data = await dbManager.getAllLivros();

            if (data.length === 0) {
                showStatus('Não há dados para exportar!', 'error');
                return;
            }

            const headers = ['id', 'numero', 'nome', 'autor', 'editora', 'emprestado', 'emprestadoPara', 'dataEmprestimo', 'dataDevolucao'];
            let csvContent = headers.join(',') + '\n';

            data.forEach(livro => {
                const row = headers.map(header => {
                    const value = livro[header] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `biblioteca_backup_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            showStatus(`Exportação CSV concluída! ${data.length} livros exportados.`, 'success');

        } catch (error) {
            console.error('Erro na exportação CSV:', error);
            showStatus('Erro ao exportar dados para CSV.', 'error');
        }
    };

    // FUNÇÃO DE IMPORTAÇÃO
    const importarArquivo = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async(e) => {
            try {
                let dataToImport = [];

                if (file.name.endsWith('.json')) {
                    const jsonData = JSON.parse(e.target.result);
                    dataToImport = jsonData.data || jsonData;
                } else if (file.name.endsWith('.csv')) {
                    const csvText = e.target.result;
                    const lines = csvText.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

                    dataToImport = lines.slice(1).map(line => {
                        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                        const obj = {};
                        headers.forEach((header, index) => {
                            let value = values[index] || '';

                            // Converter tipos apropriados
                            if (header === 'id') {
                                value = parseInt(value) || 0;
                            } else if (header === 'emprestado') {
                                value = value === 'true';
                            }

                            obj[header] = value;
                        });
                        return obj;
                    });
                }

                if (dataToImport.length === 0) {
                    showStatus('Nenhum dado válido encontrado no arquivo!', 'error');
                    return;
                }

                const confirmar = window.confirm(
                    `Importar ${dataToImport.length} livros?\n\nISTO IRÁ SUBSTITUIR TODOS OS DADOS EXISTENTES!\n\nDeseja continuar?`
                );

                if (!confirmar) return;

                // Limpar banco atual
                await dbManager.clearDatabase();

                // Importar novos dados
                let importedCount = 0;
                for (const livro of dataToImport) {
                    try {
                        // Garantir que tem um ID válido
                        if (!livro.id) {
                            livro.id = Date.now() + Math.random();
                        }

                        // Garantir campos obrigatórios
                        if (!livro.numero || !livro.nome || !livro.autor || !livro.editora) {
                            continue;
                        }

                        await dbManager.addLivro(livro);
                        importedCount++;
                    } catch (error) {
                        console.warn('Erro ao importar livro:', error);
                    }
                }

                await carregarLivros();
                showStatus(`Importação concluída! ${importedCount} livros importados.`, 'success');

            } catch (error) {
                console.error('Erro na importação:', error);
                showStatus('Erro ao importar arquivo. Verifique o formato.', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    };

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
    const livrosAtrasados = livros.filter(livro => livro.emprestado && verificarAtraso(livro.dataDevolucao));

    const adicionarLivro = async() => {
        if (novoLivro.numero && novoLivro.nome && novoLivro.autor && novoLivro.editora) {
            try {
                const livroExistente = await dbManager.getLivroByNumero(novoLivro.numero);
                if (livroExistente) {
                    showStatus('Já existe um livro com esse número!', 'error');
                    return;
                }

                const livro = {
                    id: proximoId(),
                    ...novoLivro,
                    emprestado: false,
                    emprestadoPara: '',
                    dataEmprestimo: '',
                    dataDevolucao: ''
                };

                await dbManager.addLivro(livro);
                await carregarLivros();
                setNovoLivro({ numero: '', nome: '', autor: '', editora: '' });
                setTelaAtual('principal');
                showStatus('Livro adicionado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao adicionar livro:', error);
                showStatus('Erro ao adicionar livro. Tente novamente.', 'error');
            }
        } else {
            showStatus('Por favor, preencha todos os campos!', 'error');
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

    const confirmarEmprestimo = async() => {
        if (dadosEmprestimo.nomeAluno && dadosEmprestimo.dataEmprestimo && dadosEmprestimo.dataDevolucao) {
            try {
                const livro = livros.find(l => l.id === dadosEmprestimo.livroId);
                const livroAtualizado = {
                    ...livro,
                    emprestado: true,
                    emprestadoPara: dadosEmprestimo.nomeAluno,
                    dataEmprestimo: dadosEmprestimo.dataEmprestimo,
                    dataDevolucao: dadosEmprestimo.dataDevolucao
                };

                await dbManager.updateLivro(livroAtualizado);
                await carregarLivros();
                setTelaAtual('principal');
                setDadosEmprestimo({ livroId: null, nomeAluno: '', dataEmprestimo: '', dataDevolucao: '' });
                showStatus('Empréstimo registrado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao registrar empréstimo:', error);
                showStatus('Erro ao registrar empréstimo. Tente novamente.', 'error');
            }
        } else {
            showStatus('Por favor, preencha todos os campos!', 'error');
        }
    };

    const devolverLivro = async(livroId) => {
        try {
            const livro = livros.find(l => l.id === livroId);
            if (!livro) {
                showStatus('Livro não encontrado!', 'error');
                return;
            }

            const livroAtualizado = {
                ...livro,
                emprestado: false,
                emprestadoPara: '',
                dataEmprestimo: '',
                dataDevolucao: ''
            };

            await dbManager.updateLivro(livroAtualizado);
            await carregarLivros();
            showStatus('Livro devolvido com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao devolver livro:', error);
            showStatus('Erro ao devolver livro. Tente novamente.', 'error');
        }
    };

    // Componente de Status
    const StatusMessage = () => {
            if (!status.message) return null;

            const statusClasses = {
                success: 'status-message status-success',
                error: 'status-message status-error',
                info: 'status-message status-info'
            };

            return ( <
                div className = { statusClasses[status.type] } >
                <
                div className = "flex items-center gap-2" > {
                    status.type === 'success' && < Check size = { 20 }
                    />} {
                    status.type === 'error' && < X size = { 20 }
                    />} {
                    status.type === 'info' && < Database size = { 20 }
                    />} <
                    span className = "font-medium" > { status.message } < /span> < /
                    div > <
                    /div>
                );
            };

            if (carregando) {
                return ( <
                    div className = "main-background flex items-center justify-center" >
                    <
                    div className = "text-center" >
                    <
                    div className = "spinner h-12 w-12 mx-auto mb-4" > < /div> <
                    p className = "text-white font-medium" > Carregando biblioteca... < /p> < /
                    div > <
                    /div>
                );
            }

            if (telaAtual === 'adicionar') {
                return ( <
                    div className = "main-background p-6 min-h-screen flex items-center justify-center" >
                    <
                    StatusMessage / >
                    <
                    div className = "w-full max-w-md" >
                    <
                    div className = "card p-8" >
                    <
                    div className = "flex items-center gap-3 mb-8 justify-center" >
                    <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "btn btn-gray" >
                    <
                    ArrowLeft size = { 20 }
                    /> < /
                    button > <
                    h1 className = "title-section text-2xl" > Adicionar Novo Livro < /h1> < /
                    div >

                    <
                    div className = "space-y-6" >
                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Número do Livro <
                        /label> <
                    input type = "text"
                    value = { novoLivro.numero }
                    onChange = { e => setNovoLivro({...novoLivro, numero: e.target.value }) }
                    className = "input-field text-center"
                    placeholder = "Ex: 001" /
                    >
                    <
                    /div>

                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Nome do Livro <
                        /label> <
                    input type = "text"
                    value = { novoLivro.nome }
                    onChange = { e => setNovoLivro({...novoLivro, nome: e.target.value }) }
                    className = "input-field text-center"
                    placeholder = "Ex: Dom Casmurro" /
                    >
                    <
                    /div>

                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Autor <
                    /label> <
                    input type = "text"
                    value = { novoLivro.autor }
                    onChange = { e => setNovoLivro({...novoLivro, autor: e.target.value }) }
                    className = "input-field text-center"
                    placeholder = "Ex: Machado de Assis" /
                    >
                    <
                    /div>

                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Editora <
                    /label> <
                    input type = "text"
                    value = { novoLivro.editora }
                    onChange = { e => setNovoLivro({...novoLivro, editora: e.target.value }) }
                    className = "input-field text-center"
                    placeholder = "Ex: Ática" /
                    >
                    <
                    /div>

                    <
                    div className = "flex flex-col gap-4 pt-6" >
                    <
                    button onClick = { adicionarLivro }
                    className = "btn btn-primary w-full" >
                    <
                    Plus size = { 20 }
                    />
                    Adicionar Livro <
                    /button> <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "btn btn-gray w-full" >
                    Cancelar <
                    /button> < /
                    div > <
                    /div> < /
                    div > <
                    /div> < /
                    div >
                );
            }

            if (telaAtual === 'emprestimo') {
                const livroSelecionado = livros.find(l => l.id === dadosEmprestimo.livroId);
                return ( <
                    div className = "main-background p-6 min-h-screen flex items-center justify-center" >
                    <
                    StatusMessage / >
                    <
                    div className = "w-full max-w-md" >
                    <
                    div className = "card p-8" >
                    <
                    div className = "flex items-center gap-3 mb-8 justify-center" >
                    <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "btn btn-gray" >
                    <
                    ArrowLeft size = { 20 }
                    /> < /
                    button > <
                    h1 className = "title-section text-2xl" > Empréstimo < /h1> < /
                    div >

                    {
                        livroSelecionado && ( <
                            div className = "stat-card-blue p-4 rounded-lg mb-6 text-center" >
                            <
                            h3 className = "font-semibold text-blue-300 mb-2" > Livro Selecionado: < /h3> <
                            p className = "text-blue-200 font-medium" >
                            <
                            strong > #{ livroSelecionado.numero } < /strong> - {livroSelecionado.nome} < /
                            p > <
                            p className = "text-blue-300 text-sm" > { livroSelecionado.autor } | { livroSelecionado.editora } < /p> < /
                            div >
                        )
                    }

                    <
                    div className = "space-y-6" >
                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Nome do Aluno <
                        /label> <
                    input type = "text"
                    value = { dadosEmprestimo.nomeAluno }
                    onChange = { e => setDadosEmprestimo({...dadosEmprestimo, nomeAluno: e.target.value }) }
                    className = "input-field text-center"
                    placeholder = "Ex: João Silva" /
                    >
                    <
                    /div>

                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Data de Empréstimo <
                    /label> <
                    input type = "date"
                    value = { dadosEmprestimo.dataEmprestimo }
                    onChange = { e => setDadosEmprestimo({...dadosEmprestimo, dataEmprestimo: e.target.value }) }
                    className = "input-field text-center" /
                    >
                    <
                    /div>

                    <
                    div >
                    <
                    label className = "block text-sm font-semibold text-gray-300 mb-2 text-center" >
                    Data de Devolução <
                    /label> <
                    input type = "date"
                    value = { dadosEmprestimo.dataDevolucao }
                    onChange = { e => setDadosEmprestimo({...dadosEmprestimo, dataDevolucao: e.target.value }) }
                    className = "input-field text-center" /
                    >
                    <
                    /div>

                    <
                    div className = "flex flex-col gap-4 pt-6" >
                    <
                    button onClick = { confirmarEmprestimo }
                    className = "btn btn-success w-full" >
                    <
                    Check size = { 20 }
                    />
                    Confirmar Empréstimo <
                    /button> <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "btn btn-gray w-full" >
                    Cancelar <
                    /button> < /
                    div > <
                    /div> < /
                    div > <
                    /div> < /
                    div >
                );
            }

            if (telaAtual === 'emprestados') {
                return ( <
                    div className = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" >
                    <
                    StatusMessage / >
                    <
                    div className = "max-w-6xl mx-auto" >
                    <
                    div className = "bg-white rounded-lg shadow-lg p-6 mb-6" >
                    <
                    div className = "flex items-center gap-3 mb-6" >
                    <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "text-blue-600 hover:text-blue-800 transition-colors" >
                    <
                    ArrowLeft size = { 24 }
                    /> < /
                    button > <
                    h1 className = "text-2xl font-bold text-gray-800" > Livros Emprestados < /h1> < /
                    div >

                    { /* Estatísticas dos Empréstimos */ } <
                    div className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" >
                    <
                    div className = "bg-orange-50 p-4 rounded-lg" >
                    <
                    div className = "flex items-center gap-3" >
                    <
                    User className = "text-orange-600"
                    size = { 24 }
                    /> <
                    div >
                    <
                    p className = "text-sm text-gray-600" > Total Emprestados < /p> <
                    p className = "text-2xl font-bold text-orange-600" > { livrosEmprestados.length } < /p> < /
                    div > <
                    /div> < /
                    div > <
                    /div>

                    { /* Lista de Livros Emprestados */ } <
                    div className = "bg-white rounded-lg shadow-lg overflow-hidden" >
                    <
                    div className = "overflow-x-auto" >
                    <
                    table className = "w-full" >
                    <
                    thead className = "bg-gray-50" >
                    <
                    tr >
                    <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Livro < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Aluno < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Empréstimo < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Devolução < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Status < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" > Ação < /th> < /
                    tr > <
                    /thead> <
                    tbody className = "bg-white divide-y divide-gray-200" > {
                        livrosEmprestados.map((livro) => ( <
                            tr key = { livro.id }
                            className = "hover:bg-gray-50" >
                            <
                            td className = "px-6 py-4 whitespace-nowrap" >
                            <
                            div >
                            <
                            div className = "text-sm font-medium text-gray-900" > #{ livro.numero } - { livro.nome } < /div> <
                            div className = "text-sm text-gray-500" > { livro.autor } | { livro.editora } < /div> < /
                            div > <
                            /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { livro.emprestadoPara } < /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { formatarData(livro.dataEmprestimo) } < /td> <
                            td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { formatarData(livro.dataDevolucao) } < /td> <
                            td className = "px-6 py-4 whitespace-nowrap" >
                            <
                            span className = { `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        verificarAtraso(livro.dataDevolucao) ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                                    }` } > { verificarAtraso(livro.dataDevolucao) ? 'Atrasado' : 'No Prazo' } <
                            /span> < /
                            td > <
                            td className = "px-6 py-4 whitespace-nowrap" >
                            <
                            button onClick = {
                                () => devolverLivro(livro.id)
                            }
                            className = "bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1" >
                            <
                            Check size = { 16 }
                            />
                            Devolver <
                            /button> < /
                            td > <
                            /tr>
                        ))
                    } <
                    /tbody> < /
                    table > <
                    /div> < /
                    div >

                    {
                        livrosEmprestados.length === 0 && ( <
                            div className = "text-center py-8 text-gray-500" >
                            Nenhum livro emprestado no momento <
                            /div>
                        )
                    } <
                    /div> < /
                    div > <
                    /div>
                );
            }

            if (telaAtual === 'atrasados') {
                return ( <
                    div className = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" >
                    <
                    StatusMessage / >
                    <
                    div className = "max-w-6xl mx-auto" >
                    <
                    div className = "bg-white rounded-lg shadow-lg p-6 mb-6" >
                    <
                    div className = "flex items-center gap-3 mb-6" >
                    <
                    button onClick = {
                        () => setTelaAtual('principal')
                    }
                    className = "text-blue-600 hover:text-blue-800 transition-colors" >
                    <
                    ArrowLeft size = { 24 }
                    /> < /
                    button > <
                    h1 className = "text-2xl font-bold text-red-600" > Livros Atrasados < /h1> < /
                    div >

                    <
                    div className = "bg-red-50 p-4 rounded-lg mb-6" >
                    <
                    div className = "flex items-center gap-3" >
                    <
                    Calendar className = "text-red-600"
                    size = { 24 }
                    /> <
                    div >
                    <
                    p className = "text-sm text-gray-600" > Total de Livros Atrasados < /p> <
                    p className = "text-2xl font-bold text-red-600" > { livrosAtrasados.length } < /p> < /
                    div > <
                    /div> < /
                    div > <
                    /div>

                    { /* Lista de Livros Atrasados */ } <
                    div className = "bg-white rounded-lg shadow-lg overflow-hidden" >
                    <
                    div className = "overflow-x-auto" >
                    <
                    table className = "w-full" >
                    <
                    thead className = "bg-red-50" >
                    <
                    tr >
                    <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Livro < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Aluno < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Empréstimo < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Devolução < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Dias de Atraso < /th> <
                    th className = "px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider" > Ação < /th> < /
                    tr > <
                    /thead> <
                    tbody className = "bg-white divide-y divide-gray-200" > {
                        livrosAtrasados.map((livro) => {
                            const hoje = new Date();
                            const dataDevolucao = new Date(livro.dataDevolucao);
                            const diasAtraso = Math.floor((hoje - dataDevolucao) / (1000 * 60 * 60 * 24));

                            return ( <
                                tr key = { livro.id }
                                className = "hover:bg-red-50" >
                                <
                                td className = "px-6 py-4 whitespace-nowrap" >
                                <
                                div >
                                <
                                div className = "text-sm font-medium text-gray-900" > #{ livro.numero } - { livro.nome } < /div> <
                                div className = "text-sm text-gray-500" > { livro.autor } | { livro.editora } < /div> < /
                                div > <
                                /td> <
                                td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { livro.emprestadoPara } < /td> <
                                td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { formatarData(livro.dataEmprestimo) } < /td> <
                                td className = "px-6 py-4 whitespace-nowrap text-sm text-gray-900" > { formatarData(livro.dataDevolucao) } < /td> <
                                td className = "px-6 py-4 whitespace-nowrap" >
                                <
                                span className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" > { diasAtraso } { diasAtraso === 1 ? 'dia' : 'dias' } <
                                /span> < /
                                td > <
                                td className = "px-6 py-4 whitespace-nowrap" >
                                <
                                button onClick = {
                                    () => devolverLivro(livro.id)
                                }
                                className = "bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1" >
                                <
                                Check size = { 16 }
                                />
                                Devolver <
                                /button> < /
                                td > <
                                /tr>
                            );
                        })
                    } <
                    /tbody> < /
                    table > <
                    /div> < /
                    div >

                    {
                        livrosAtrasados.length === 0 && ( <
                            div className = "text-center py-8 text-gray-500" >
                            <
                            div className = "text-green-600 mb-2" >
                            <
                            Check size = { 48 }
                            className = "mx-auto mb-2" / >
                            <
                            /div>
                            Nenhum livro atrasado!Todos os empréstimos estão em dia. <
                            /div>
                        )
                    } <
                    /div> < /
                    div >
                );
            }

            // Tela principal
            return ( <
                    div className = "main-background min-h-screen" >
                    <
                    StatusMessage / >

                    { /* Header centralizado */ } <
                    div className = "text-center py-16" >
                    <
                    div className = "flex items-center justify-center gap-4 mb-4" >
                    <
                    BookOpen className = "text-indigo-400"
                    size = { 48 }
                    /> <
                    h1 className = "title-main text-5xl font-bold" >
                    Biblioteca Wilson Tartarotti <
                    /h1> < /
                    div > <
                    p className = "text-gray-300 text-xl font-medium mb-2" > EMEF Padre Vicente Bertoni < /p> <
                    p className = "text-gray-400 text-lg" > Sistema de Gerenciamento de Livros < /p> < /
                    div >

                    { /* Container totalmente centralizado */ } <
                    div className = "flex flex-col items-center px-6" >

                    { /* Menu de botões organizados */ } <
                    div className = "button-group mb-12" > { /* Grupo principal de ações */ } <
                    div className = "button-group-section" >
                    <
                    button onClick = {
                        () => setTelaAtual('adicionar')
                    }
                    className = "btn btn-primary" >
                    <
                    Plus size = { 20 }
                    />
                    Adicionar <
                    /button> <
                    button onClick = {
                        () => setTelaAtual('emprestados')
                    }
                    className = "btn btn-warning" >
                    <
                    User size = { 20 }
                    />
                    Emprestados({ livrosEmprestados.length }) <
                    /button> <
                    button onClick = {
                        () => setTelaAtual('atrasados')
                    }
                    className = "btn btn-danger" >
                    <
                    Calendar size = { 20 }
                    />
                    Atrasados({ livrosAtrasados.length }) <
                    /button> < /
                    div >

                    { /* Separador visual */ } <
                    div className = "w-px" > < /div> <
                    div className = "mobile-separator hidden md:hidden" > < /div>

                    { /* Grupo de ferramentas */ } <
                    div className = "button-group-section" >
                    <
                    button onClick = { exportarParaJSON }
                    className = "btn btn-success"
                    title = "Exportar como JSON" >
                    <
                    Download size = { 16 }
                    />
                    JSON <
                    /button> <
                    button onClick = { exportarParaCSV }
                    className = "btn btn-success"
                    title = "Exportar como CSV" >
                    <
                    FileText size = { 16 }
                    />
                    CSV <
                    /button> <
                    label className = "btn btn-purple cursor-pointer"
                    title = "Importar arquivo" >
                    <
                    Upload size = { 16 }
                    />
                    Importar <
                    input type = "file"
                    accept = ".json,.csv"
                    onChange = { importarArquivo }
                    className = "hidden" / >
                    <
                    /label> < /
                    div > <
                    /div>

                    { /* Estatísticas em grid 2x2 centralizado */ } <
                    div className = "grid grid-cols-2 gap-6 mb-12 w-full max-w-2xl" >
                    <
                    div className = "stat-card-blue p-8 rounded-xl card-hover text-center" >
                    <
                    BookOpen className = "mx-auto mb-4 text-blue-400"
                    size = { 40 }
                    /> <
                    p className = "text-sm text-gray-400 mb-2" > Total de Livros < /p> <
                    p className = "text-3xl font-bold text-blue-400" > { livros.length } < /p> < /
                    div >

                    <
                    div className = "stat-card-green p-8 rounded-xl card-hover text-center" >
                    <
                    Check className = "mx-auto mb-4 text-green-400"
                    size = { 40 }
                    /> <
                    p className = "text-sm text-gray-400 mb-2" > Disponíveis < /p> <
                    p className = "text-3xl font-bold text-green-400" > { livrosDisponiveis.length } < /p> < /
                    div >

                    <
                    div className = "stat-card-orange p-8 rounded-xl card-hover text-center cursor-pointer"
                    onClick = {
                        () => setTelaAtual('emprestados')
                    } >
                    <
                    User className = "mx-auto mb-4 text-orange-400"
                    size = { 40 }
                    /> <
                    p className = "text-sm text-gray-400 mb-2" > Emprestados < /p> <
                    p className = "text-3xl font-bold text-orange-400" > { livrosEmprestados.length } < /p> < /
                    div >

                    <
                    div className = "stat-card-red p-8 rounded-xl card-hover text-center cursor-pointer"
                    onClick = {
                        () => setTelaAtual('atrasados')
                    } >
                    <
                    Calendar className = "mx-auto mb-4 text-red-400"
                    size = { 40 }
                    /> <
                    p className = "text-sm text-gray-400 mb-2" > Atrasados < /p> <
                    p className = "text-3xl font-bold text-red-400" > { livrosAtrasados.length } < /p> < /
                    div > <
                    /div>

                    { /* Barra de pesquisa melhorada */ } <
                    div className = "w-full max-w-lg mb-16" >
                    <
                    div className = "search-container" >
                    <
                    div className = "search-input-wrapper" >
                    <
                    Search className = "search-icon"
                    size = { 22 }
                    /> <
                    input type = "text"
                    placeholder = "Buscar por título, autor, número ou editora..."
                    value = { termoPesquisa }
                    onChange = { e => setTermoPesquisa(e.target.value) }
                    className = "search-input" /
                    >
                    {
                        termoPesquisa && ( <
                            button onClick = {
                                () => setTermoPesquisa('')
                            }
                            className = "search-clear-btn"
                            title = "Limpar pesquisa" >
                            <
                            X size = { 18 }
                            /> < /
                            button >
                        )
                    } <
                    /div> {
                    termoPesquisa && ( <
                        div className = "search-results-info" > { livrosFiltrados.length } { livrosFiltrados.length === 1 ? 'resultado encontrado' : 'resultados encontrados' } <
                        /div>
                    )
                } <
                /div> < /
                div >

                { /* Tabela de livros centralizada */ } <
                div className = "w-full max-w-4xl" >
                <
                div className = "table-container" >
                <
                div className = "overflow-x-auto" >
                <
                table className = "w-full" >
                <
                thead className = "table-header" >
                <
                tr >
                <
                th className = "px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" > # < /th> <
            th className = "px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" > Livro < /th> <
            th className = "px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" > Status < /th> <
            th className = "px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" > Ação < /th> < /
                tr > <
                /thead> <
            tbody className = "divide-y divide-gray-800" > {
                    livrosFiltrados.map((livro) => ( <
                        tr key = { livro.id }
                        className = "table-row" >
                        <
                        td className = "px-6 py-4 text-center" >
                        <
                        span className = "text-sm font-mono text-gray-300" > { livro.numero } < /span> < /
                        td > <
                        td className = "px-6 py-4" >
                        <
                        div className = "text-center" >
                        <
                        div className = "text-sm font-medium text-gray-200" > { livro.nome } < /div> <
                        div className = "text-xs text-gray-400" > { livro.autor }• { livro.editora } < /div> < /
                        div > <
                        /td> <
                        td className = "px-6 py-4 text-center" > {
                            livro.emprestado ? ( <
                                div >
                                <
                                span className = { `status-badge ${
                                                            verificarAtraso(livro.dataDevolucao) ? 'status-overdue' : 'status-borrowed'
                                                        }` } > { verificarAtraso(livro.dataDevolucao) ? 'Atrasado' : 'Emprestado' } <
                                /span> <
                                div className = "text-xs text-gray-500 mt-1" > { livro.emprestadoPara } <
                                /div> <
                                div className = "text-xs text-gray-600" >
                                Até: { formatarData(livro.dataDevolucao) } <
                                /div> < /
                                div >
                            ) : ( <
                                span className = "status-badge status-available" >
                                Disponível <
                                /span>
                            )
                        } <
                        /td> <
                        td className = "px-6 py-4 text-center" > {
                            livro.emprestado ? ( <
                                button onClick = {
                                    () => devolverLivro(livro.id)
                                }
                                className = "btn btn-success btn-sm" >
                                <
                                Check size = { 14 }
                                />
                                Devolver <
                                /button>
                            ) : ( <
                                button onClick = {
                                    () => emprestarLivro(livro.id)
                                }
                                className = "btn btn-primary btn-sm" >
                                <
                                User size = { 14 }
                                />
                                Emprestar <
                                /button>
                            )
                        } <
                        /td> < /
                        tr >
                    ))
                } <
                /tbody> < /
                table > <
                /div> < /
                div >

                {
                    livrosFiltrados.length === 0 && ( <
                        div className = "text-center py-16 text-gray-500" >
                        <
                        BookOpen size = { 64 }
                        className = "mx-auto mb-4 text-gray-600" / >
                        <
                        p className = "text-xl font-medium mb-4" > {
                            termoPesquisa ?
                            `Nenhum livro encontrado para "${termoPesquisa}"` : 'Nenhum livro cadastrado'
                        } <
                        /p> {!termoPesquisa && ( <
                            button onClick = {
                                () => setTelaAtual('adicionar')
                            }
                            className = "btn btn-primary" >
                            <
                            Plus size = { 16 }
                            />
                            Adicionar primeiro livro <
                            /button>
                        )
                    } <
                    /div>
                )
        } <
        /div> < /
        div > <
        /div>
);
};

export default BibliotecaEscolar;