<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>チェックリスト用マスター登録 アプリ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #2d3748; }
        ::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #718096; }
        .modal-transition { transition: opacity 0.3s ease, transform 0.3s ease; }
        .textarea-config { min-height: 200px; font-family: monospace; }
        .hidden { display: none; }
        .tab-btn.active {
            border-color: #a78bfa;
            color: #c4b5fd;
        }
        .copy-path-btn {
            cursor: pointer;
            transition: color 0.2s;
        }
        .copy-path-btn:hover {
            color: #fff;
        }
    </style>
</head>
<body class="bg-gray-900 text-white antialiased">
    <!-- File inputs for CSV imports -->
    <input type="file" id="master-csv-import-input" class="hidden" accept=".csv">
    <input type="file" id="employee-csv-import-input" class="hidden" accept=".csv">

    <!-- Firebase接続設定モーダル (通常は非表示) -->
    <div id="firebase-config-modal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 hidden">
        <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700">
            <h2 class="text-2xl font-semibold mb-6">初期設定</h2>
            <p class="text-gray-400">Firebaseへの接続に失敗しました。設定情報を確認してください。</p>
            <form id="firebase-config-form" class="space-y-6 mt-4">
                <div>
                    <label for="data-id-input" class="block text-sm font-medium text-gray-300 mb-2">1. データID（固定の倉庫名）</label>
                    <input type="text" id="data-id-input" required class="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none transition" placeholder="例: my-master-data-2025">
                </div>
                <div>
                    <label for="firebase-config-input" class="block text-sm font-medium text-gray-300 mb-2">2. Firebase 接続設定</label>
                    <textarea id="firebase-config-input" class="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition textarea-config" placeholder="const firebaseConfig = { ... };"></textarea>
                </div>
                <p id="config-error" class="text-red-400 text-sm mt-2 hidden"></p>
                <div class="flex justify-end gap-4 pt-4">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">再接続</button>
                </div>
            </form>
        </div>
    </div>

    <!-- メインアプリケーション -->
    <div id="main-app" class="hidden">
        <div class="container mx-auto p-4 sm:p-6 lg:p-8">
            <header class="mb-8 flex justify-between items-start">
                 <div>
                    <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                        <span class="text-yellow-400">【最適化版】</span>チェックリスト用マスター登録 アプリ
                    </h1>
                    <p class="text-gray-400 mt-2">従業員、店舗、役職、什器、作業、商品カテゴリ、イベント、習得確認などの情報を一元管理します。</p>
                </div>
                <div class="text-right">
                     <div id="data-id-display" class="mt-2 text-sm text-purple-400"></div>
                    <div id="status-indicator" class="mt-2 text-sm text-yellow-400 animate-pulse">
                        Firebaseに接続中...
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button id="show-employee-list-modal-btn" class="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                            従業員リスト管理
                        </button>
                         <button id="show-master-modal-btn" class="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                            マスタ管理
                        </button>
                        <button id="show-path-info-modal-btn" class="text-sm bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                            データ保管場所
                        </button>
                    </div>
                </div>
            </header>
            
            <div id="db-error-message" class="hidden bg-red-900 border-l-4 border-red-500 text-red-300 p-4 rounded-r-lg mb-6">
                <p class="font-bold">データベースエラー</p>
                <p class="text-sm">データの読み込みに失敗しました。Firebaseの無料利用枠の上限に達した可能性があります。しばらくしてからページを再読み込みするか、Firebaseコンソールで状況を確認してください。</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
                <!-- 従業員登録フォーム -->
                <div id="employee-form-container" class="lg:col-span-1 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                    <div class="flex justify-between items-center mb-6">
                         <h2 class="text-2xl font-semibold text-white flex items-center gap-2">従業員登録</h2>
                        <button id="show-bulk-import-btn" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200">
                            一括登録
                        </button>
                    </div>
                    <form id="add-employee-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="lastName" class="block text-sm font-medium text-gray-300 mb-1">姓</label>
                                <input type="text" id="lastName" name="lastName" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="鈴木">
                            </div>
                            <div>
                                <label for="firstName" class="block text-sm font-medium text-gray-300 mb-1">名</label>
                                <input type="text" id="firstName" name="firstName" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="一郎">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="lastName_kana" class="block text-sm font-medium text-gray-300 mb-1">セイ (フリガナ)</label>
                                <input type="text" id="lastName_kana" name="lastName_kana" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="スズキ">
                            </div>
                            <div>
                                <label for="firstName_kana" class="block text-sm font-medium text-gray-300 mb-1">メイ (フリガナ)</label>
                                <input type="text" id="firstName_kana" name="firstName_kana" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="イチロウ">
                            </div>
                        </div>
                        <div>
                            <label for="nickname" class="block text-sm font-medium text-gray-300 mb-1">ニックネーム</label>
                            <input type="text" id="nickname" name="nickname" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="すずきんぐ">
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-300 mb-1">メールアドレス</label>
                            <input type="email" id="email" name="email" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="suzuki@example.com">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="employeeId" class="block text-sm font-medium text-gray-300 mb-1">従業員ID</label>
                                <input type="text" id="employeeId" name="employeeId" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="S001">
                            </div>
                             <div>
                                <label for="hourly_wage" class="block text-sm font-medium text-gray-300 mb-1">時給</label>
                                <input type="number" id="hourly_wage" name="hourly_wage" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="1000">
                            </div>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="pincode" class="block text-sm font-medium text-gray-300 mb-1">PINコード</label>
                                <input type="text" id="pincode" name="pincode" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="123" maxlength="3" pattern="[0-9]{3}">
                            </div>
                            <div>
                                <label for="retirementDate" class="block text-sm font-medium text-gray-300 mb-1">退職日</label>
                                <input type="date" id="retirementDate" name="retirementDate" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500">
                            </div>
                        </div>
                        <div>
                            <label for="store" class="block text-sm font-medium text-gray-300 mb-1">所属店舗</label>
                            <select id="store" name="store" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"></select>
                        </div>
                        <div>
                            <label for="role" class="block text-sm font-medium text-gray-300 mb-1">役職</label>
                            <select id="role" name="role" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"></select>
                        </div>
                        <button type="submit" class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform hover:scale-105">登録</button>
                    </form>
                </div>
            
                <!-- マスタ入力フォームエリア -->
                <div id="master-forms-container" class="lg:col-span-1 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                     <h2 class="text-2xl font-semibold text-white flex items-center gap-2 mb-6">マスタ項目追加</h2>
                     <div class="border-b border-gray-700 mb-4">
                        <nav id="main-master-tabs" class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                             <a href="#main-tab-stores" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">店舗</a>
                             <a href="#main-tab-roles" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">役職</a>
                             <a href="#main-tab-fixtures" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">什器</a>
                             <a href="#main-tab-work_types" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業種類</a>
                             <a href="#main-tab-work_items" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業項目</a>
                             <a href="#main-tab-work_times" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業時間</a>
                             <a href="#main-tab-product_categories" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">商品カテゴリ</a>
                             <a href="#main-tab-events" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">イベント</a>
                             <a href="#main-tab-skill_categories" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">習得カテゴリ</a>
                             <a href="#main-tab-skill_checks" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">習得確認</a>
                             <a href="#main-tab-toilet_cleaning" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">トイレ掃除</a>
                             <a href="#main-tab-handovers" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">引き継ぎ</a>
                             <a href="#main-tab-haccp" class="tab-btn main-master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">HACCP</a>
                        </nav>
                    </div>
                    <div id="main-master-tab-content-container">
                        <div id="main-tab-stores" class="main-master-tab-content">
                            <form id="add-store-form" class="flex gap-2">
                                <input type="text" id="new-store-name" placeholder="新しい店舗名を追加" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500">
                                <button type="submit" class="bg-cyan-600 hover:bg-cyan-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-roles" class="main-master-tab-content hidden">
                            <form id="add-role-form" class="flex gap-2">
                                <input type="text" id="new-role-name" placeholder="新しい役職名を追加" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500">
                                <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-fixtures" class="main-master-tab-content hidden">
                            <form id="add-fixture-form" class="space-y-2">
                                <input type="text" id="new-fixture-name" placeholder="新しい什器名を追加" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                <input type="text" id="new-fixture-manufacturer" placeholder="メーカー名" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="text" id="new-fixture-model-number" placeholder="型番" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                    <input type="text" id="new-fixture-model-type" placeholder="型式" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                </div>
                                <div class="flex gap-2">
                                    <input type="number" id="new-fixture-temp-min" placeholder="下限温度(℃)" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                    <input type="number" id="new-fixture-temp-max" placeholder="上限温度(℃)" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500">
                                </div>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" id="new-fixture-manual-drain" class="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-teal-500 focus:ring-teal-500">
                                    <span>手動排水が必要</span>
                                </label>
                                <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-work_types" class="main-master-tab-content hidden">
                             <form id="add-work-type-form" class="flex gap-2">
                                <input type="text" id="new-work-type-name" placeholder="新しい作業種類を追加 (例: 清掃)" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500">
                                <button type="submit" class="bg-pink-600 hover:bg-pink-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                         <div id="main-tab-work_items" class="main-master-tab-content hidden">
                            <form id="add-work-item-form" class="space-y-3">
                                <input type="text" id="new-work-item-name" placeholder="新しい作業項目名を追加 (例: 床清掃)" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500">
                                <input type="number" id="new-work-item-time" placeholder="適正時間（分）" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500">
                                <div>
                                    <label class="text-sm text-gray-300">所属する作業種類を選択</label>
                                    <div id="work-type-checkboxes" class="mt-2 space-y-2 max-h-32 overflow-y-auto p-2 bg-gray-900 rounded-md">
                                        <p class="text-gray-500 text-sm">作業種類を先に登録してください</p>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-sm text-gray-300">実施曜日を選択</label>
                                    <div id="add-work-item-days" class="mt-2 grid grid-cols-4 gap-x-4 gap-y-2">
                                        <!-- JS will populate this -->
                                    </div>
                                </div>
                                <button type="submit" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-work_times" class="main-master-tab-content hidden">
                            <form id="add-work-time-form" class="space-y-3">
                                <input type="text" id="new-work-time-name" placeholder="作業名 (例: レジ締め)" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500">
                                <input type="text" id="new-work-time-category" placeholder="カテゴリ (例: 締め作業)" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500">
                                <input type="number" id="new-work-time-standard-time" placeholder="基準時間（分）" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500">
                                <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                         <div id="main-tab-product_categories" class="main-master-tab-content hidden">
                            <form id="add-product-category-form" class="flex gap-2">
                                <input type="text" id="new-product-category-name" placeholder="新しい商品カテゴリを追加 (例: 飲料)" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500">
                                <button type="submit" class="bg-lime-600 hover:bg-lime-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                         <div id="main-tab-events" class="main-master-tab-content hidden">
                             <form id="add-event-form" class="flex gap-2">
                                <input type="text" id="new-event-name" placeholder="新しいイベント名を追加 (例: 地域お祭り)" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                                <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-skill_categories" class="main-master-tab-content hidden">
                            <form id="add-skill-category-form" class="flex gap-2">
                                <input type="text" id="new-skill-category-name" placeholder="新しい習得カテゴリを追加 (例: レジ項目)" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-skill_checks" class="main-master-tab-content hidden">
                           <form id="add-skill-check-form" class="space-y-3">
                                <input type="text" id="new-skill-check-name" placeholder="新しい習得確認項目を追加" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500">
                                <div>
                                    <label class="text-sm text-gray-300">所属する習得カテゴリを選択</label>
                                    <select id="skill-category-select" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-sky-500">
                                        <option value="">選択してください</option>
                                    </select>
                                </div>
                                <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-toilet_cleaning" class="main-master-tab-content hidden">
                            <form id="add-toilet-cleaning-form" class="flex gap-2">
                                <input type="text" id="new-toilet-cleaning-name" placeholder="新しいトイレ掃除項目を追加" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-500">
                                <button type="submit" class="bg-slate-600 hover:bg-slate-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-handovers" class="main-master-tab-content hidden">
                            <form id="add-handover-form" class="flex gap-2">
                                <input type="text" id="new-handover-name" placeholder="新しい引き継ぎ項目を追加" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-500">
                                <button type="submit" class="bg-zinc-600 hover:bg-zinc-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                        <div id="main-tab-haccp" class="main-master-tab-content hidden">
                            <form id="add-haccp-form" class="flex gap-2">
                                <input type="text" id="new-haccp-name" placeholder="新しいHACCP項目を追加" required class="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500">
                                <button type="submit" class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold p-2 rounded-lg text-sm transition">追加</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- モーダル各種 -->
    <div id="employee-list-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden modal-transition opacity-0 z-40">
        <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-7xl h-5/6 border border-gray-700 transform scale-95 modal-transition flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold">従業員リスト管理</h2>
                <div class="flex items-center gap-4">
                    <button id="import-employees-csv-btn" class="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">CSVインポート</button>
                    <button id="export-employees-csv-btn" class="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition">CSVエクスポート</button>
                    <button id="deduplicate-employees-btn" class="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">重複削除</button>
                    <button id="close-employee-list-modal-btn" class="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
            </div>
            <div class="border-b border-gray-700 mb-4">
                <nav id="employee-tabs" class="-mb-px flex space-x-4" aria-label="Tabs">
                    <a href="#active-employees" class="tab-btn employee-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">在職者</a>
                    <a href="#retired-employees" class="tab-btn employee-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">退職者</a>
                </nav>
            </div>
             <div class="overflow-y-auto flex-grow">
                <div id="active-employees" class="employee-tab-content">
                    <table class="w-full text-sm text-left text-gray-300">
                        <thead class="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>
                                <th class="px-6 py-3 rounded-l-lg">氏名</th>
                                <th class="px-6 py-3">フリガナ</th>
                                <th class="px-6 py-3">ニックネーム</th>
                                <th class="px-6 py-3">メールアドレス</th>
                                <th class="px-6 py-3">従業員ID</th>
                                <th class="px-6 py-3">PIN</th>
                                <th class="px-6 py-3">所属店舗</th>
                                <th class="px-6 py-3">役職</th>
                                <th class="px-6 py-3">時給</th>
                                <th class="px-6 py-3">退職日</th>
                                <th class="px-6 py-3 rounded-r-lg text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody id="active-employee-list"></tbody>
                    </table>
                </div>
                <div id="retired-employees" class="employee-tab-content hidden">
                     <table class="w-full text-sm text-left text-gray-300">
                        <thead class="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>
                                <th class="px-6 py-3 rounded-l-lg">氏名</th>
                                <th class="px-6 py-3">フリガナ</th>
                                <th class="px-6 py-3">ニックネーム</th>
                                <th class="px-6 py-3">メールアドレス</th>
                                <th class="px-6 py-3">従業員ID</th>
                                <th class="px-6 py-3">PIN</th>
                                <th class="px-6 py-3">所属店舗</th>
                                <th class="px-6 py-3">役職</th>
                                <th class="px-6 py-3">時給</th>
                                <th class="px-6 py-3">退職日</th>
                                <th class="px-6 py-3 rounded-r-lg text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody id="retired-employee-list"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div id="master-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden modal-transition opacity-0 z-40">
        <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-5xl h-5/6 border border-gray-700 transform scale-95 modal-transition flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold">マスタデータ管理</h2>
                 <div class="flex gap-2">
                    <button id="import-master-csv-btn" class="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">CSVインポート</button>
                    <button id="export-master-csv-btn" class="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition">CSVエクスポート</button>
                    <button id="close-master-modal-btn" class="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
            </div>
            <div class="flex flex-col flex-grow min-h-0">
                 <div class="border-b border-gray-700 mb-4">
                    <nav id="master-tabs" class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                         <a href="#master-tab-content-stores" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">店舗</a>
                         <a href="#master-tab-content-roles" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">役職</a>
                         <a href="#master-tab-content-fixtures" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">什器</a>
                         <a href="#master-tab-content-work-types" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業種類</a>
                         <a href="#master-tab-content-work-items" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業項目</a>
                         <a href="#master-tab-content-work-times" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">作業時間</a>
                         <a href="#master-tab-content-product-categories" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">商品カテゴリ</a>
                         <a href="#master-tab-content-events" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">イベント</a>
                         <a href="#master-tab-content-skill-categories" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">習得カテゴリ</a>
                         <a href="#master-tab-content-skill-checks" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">習得確認</a>
                         <a href="#master-tab-content-toilet-cleaning" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">トイレ掃除</a>
                         <a href="#master-tab-content-handovers" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">引き継ぎ</a>
                         <a href="#master-tab-content-haccp" class="tab-btn master-tab-btn whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm">HACCP</a>
                    </nav>
                </div>
                <div class="flex-grow overflow-y-auto pr-2 min-h-0">
                    <div id="master-tab-content-stores" class="master-tab-content"><ul id="store-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-roles" class="master-tab-content hidden"><table class="w-full text-sm text-left text-gray-300"><thead class="text-xs text-gray-400 uppercase bg-gray-700"><tr><th class="px-4 py-2 rounded-l-lg">役職名</th><th class="px-4 py-2">担当作業項目</th><th class="px-4 py-2 rounded-r-lg text-center">操作</th></tr></thead><tbody id="role-master-list"></tbody></table></div>
                    <div id="master-tab-content-fixtures" class="master-tab-content hidden"><table class="w-full text-sm text-left text-gray-300"><thead class="text-xs text-gray-400 uppercase bg-gray-700"><tr><th class="px-4 py-2 rounded-l-lg">什器名</th><th class="px-4 py-2">メーカー名</th><th class="px-4 py-2">型番</th><th class="px-4 py-2">型式</th><th class="px-4 py-2">下限(℃)</th><th class="px-4 py-2">上限(℃)</th><th class="px-4 py-2">手動排水</th><th class="px-4 py-2 rounded-r-lg text-center">操作</th></tr></thead><tbody id="fixture-master-list"></tbody></table></div>
                    <div id="master-tab-content-work-types" class="master-tab-content hidden"><ul id="work-type-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-work-items" class="master-tab-content hidden">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th class="px-4 py-2 rounded-l-lg">作業項目名</th>
                                    <th class="px-4 py-2">所属する作業種類</th>
                                    <th class="px-4 py-2">実施曜日</th>
                                    <th class="px-4 py-2">適正時間(分)</th>
                                    <th class="px-4 py-2 rounded-r-lg text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody id="work-item-master-list"></tbody>
                        </table>
                    </div>
                     <div id="master-tab-content-work-times" class="master-tab-content hidden">
                        <table class="w-full text-sm text-left text-gray-300">
                            <thead class="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th class="px-4 py-2 rounded-l-lg">作業名</th>
                                    <th class="px-4 py-2">カテゴリ</th>
                                    <th class="px-4 py-2">基準時間(分)</th>
                                    <th class="px-4 py-2 rounded-r-lg text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody id="work-times-master-list"></tbody>
                        </table>
                    </div>
                    <div id="master-tab-content-product-categories" class="master-tab-content hidden"><ul id="product-category-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-events" class="master-tab-content hidden"><ul id="event-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-skill-categories" class="master-tab-content hidden"><ul id="skill-category-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-skill-checks" class="master-tab-content hidden"><table class="w-full text-sm text-left text-gray-300"><thead class="text-xs text-gray-400 uppercase bg-gray-700"><tr><th class="px-4 py-2 rounded-l-lg">習得確認項目</th><th class="px-4 py-2">所属カテゴリ</th><th class="px-4 py-2 rounded-r-lg text-center">操作</th></tr></thead><tbody id="skill-check-master-list"></tbody></table></div>
                    <div id="master-tab-content-toilet-cleaning" class="master-tab-content hidden"><ul id="toilet-cleaning-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-handovers" class="master-tab-content hidden"><ul id="handover-master-list" class="space-y-2"></ul></div>
                    <div id="master-tab-content-haccp" class="master-tab-content hidden"><ul id="haccp-master-list" class="space-y-2"></ul></div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="path-info-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden modal-transition opacity-0 z-40">
        <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl h-5/6 border border-gray-700 transform scale-95 modal-transition flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold">データ保管場所（コレクションパス）</h2>
                <button id="close-path-info-modal-btn" class="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>
            <div class="flex-grow overflow-y-auto pr-4 min-h-0">
                 <p class="text-gray-400 mb-4">各マスタデータは、Firebase Firestore上の以下のパスに保管されています。新しいアプリからこれらのデータを参照する際に、このパスを指定してください。</p>
                 <div id="collection-path-list" class="space-y-3"></div>
            </div>
        </div>
    </div>


    <div id="edit-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden modal-transition opacity-0 z-50">
        <div class="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 transform scale-95 modal-transition flex flex-col h-5/6">
            <h2 id="edit-modal-title" class="text-2xl font-semibold p-8 pb-6 flex-shrink-0">情報の編集</h2>
            <div class="overflow-y-auto px-8 flex-grow">
                <div id="edit-employee-form-container">
                    <form id="edit-employee-form" class="space-y-4">
                        <input type="hidden" id="edit-doc-id">
                         <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">姓</span><input type="text" id="edit-lastName" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">名</span><input type="text" id="edit-firstName" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">セイ (フリガナ)</span><input type="text" id="edit-lastName_kana" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">メイ (フリガナ)</span><input type="text" id="edit-firstName_kana" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        </div>
                        <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">ニックネーム</span><input type="text" id="edit-nickname" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">メールアドレス</span><input type="email" id="edit-email" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">従業員ID</span><input type="text" id="edit-employeeId" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">PINコード</span><input type="text" id="edit-pincode" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500" maxlength="3" pattern="[0-9]{3}"></label>
                        </div>
                         <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">時給</span><input type="number" id="edit-hourly_wage" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">退職日</span><input type="date" id="edit-retirementDate" name="retirementDate" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        </div>
                        <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">所属店舗</span><select id="edit-store" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></select></label>
                        <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">役職</span><select id="edit-role" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></select></label>
                    </form>
                </div>
                 <div id="edit-fixture-form-container" class="hidden">
                      <form id="edit-fixture-form" class="space-y-4">
                        <input type="hidden" id="edit-fixture-doc-id">
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">什器名</span><input type="text" id="edit-fixture-name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">メーカー名</span><input type="text" id="edit-fixture-manufacturer" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                          <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">型番</span><input type="text" id="edit-fixture-model-number" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">型式</span><input type="text" id="edit-fixture-model-type" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                          </div>
                          <div class="grid grid-cols-2 gap-4">
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">下限温度(℃)</span><input type="number" id="edit-fixture-temp-min" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                            <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">上限温度(℃)</span><input type="number" id="edit-fixture-temp-max" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                        </div>
                         <label class="flex items-center space-x-2 text-sm cursor-pointer">
                            <input type="checkbox" id="edit-fixture-manual-drain" class="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-orange-500 focus:ring-orange-500">
                            <span>手動排水が必要</span>
                        </label>
                      </form>
                </div>
                <div id="edit-work-item-form-container" class="hidden">
                      <form id="edit-work-item-form" class="space-y-4">
                        <input type="hidden" id="edit-work-item-doc-id">
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">作業項目名</span><input type="text" id="edit-work-item-name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">適正時間（分）</span><input type="number" id="edit-work-item-time" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <div>
                            <label class="text-sm text-gray-300">所属する作業種類を選択</label>
                            <div id="edit-work-type-checkboxes" class="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-900 rounded-md"></div>
                        </div>
                        <div>
                            <label class="text-sm text-gray-300">実施曜日を選択</label>
                            <div id="edit-work-item-days" class="mt-2 grid grid-cols-4 gap-x-4 gap-y-2">
                                <!-- JS will populate this -->
                            </div>
                        </div>
                      </form>
                </div>
                 <div id="edit-work-time-form-container" class="hidden">
                      <form id="edit-work-time-form" class="space-y-4">
                        <input type="hidden" id="edit-work-time-doc-id">
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">作業名</span><input type="text" id="edit-work-time-name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">カテゴリ</span><input type="text" id="edit-work-time-category" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">基準時間（分）</span><input type="number" id="edit-work-time-standard-time" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                      </form>
                </div>
                <div id="edit-skill-check-form-container" class="hidden">
                      <form id="edit-skill-check-form" class="space-y-4">
                        <input type="hidden" id="edit-skill-check-doc-id">
                         <label class="block"><span class="text-sm font-medium text-gray-300 mb-1 block">習得確認項目名</span><input type="text" id="edit-skill-check-name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                         <div>
                            <label class="text-sm text-gray-300">所属する習得カテゴリを選択</label>
                            <select id="edit-skill-category-select" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-sky-500"></select>
                        </div>
                      </form>
                </div>
                 <div id="edit-role-skills-form-container" class="hidden">
                      <form id="edit-role-skills-form" class="space-y-4">
                        <input type="hidden" id="edit-role-doc-id">
                         <div>
                            <label class="text-sm text-gray-300">この役職が担当できる作業項目を選択</label>
                            <div id="edit-role-skills-checkboxes" class="mt-2 space-y-2 max-h-64 overflow-y-auto p-2 bg-gray-900 rounded-md"></div>
                        </div>
                      </form>
                </div>
                <div id="edit-simple-master-form-container" class="hidden">
                    <form id="edit-simple-master-form">
                         <label class="block"><span id="edit-simple-master-label" class="text-sm font-medium text-gray-300 mb-1 block">項目名</span><input type="text" id="edit-simple-master-name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"></label>
                    </form>
                </div>
            </div>
             <div class="flex-shrink-0 flex justify-end gap-4 p-8 pt-6">
                <button type="button" id="cancel-edit" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">キャンセル</button>
                <button type="submit" id="save-edit-btn" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition">更新する</button>
            </div>
        </div>
    </div>
    
    <div id="bulk-import-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden modal-transition opacity-0 z-50">
         <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl border border-gray-700 transform scale-95 modal-transition">
            <h2 class="text-2xl font-semibold mb-4">テキストで一括登録</h2>
            <p class="text-gray-400 mb-2">下のテキストエリアに、カンマ区切りの従業員データを一行ずつ貼り付けてください。</p>
            <p class="text-sm bg-gray-700 p-3 rounded-lg text-gray-300 mb-4"><code>姓,名,セイ,メイ,従業員ID,メールアドレス,所属店舗,役職,PINコード,時給,退職日(YYYY-MM-DD)</code></p>
            <form id="bulk-import-form">
                <textarea id="csv-data" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 textarea-csv" placeholder="鈴木,一郎,スズキ,イチロウ,S001,suzuki@example.com,店舗1,スタッフ,123,1000,&#10;佐藤,花子,サトウ,ハナコ,S002,sato@example.com,店舗2,研修中,456,950,2023-03-31"></textarea>
                <div class="flex justify-end gap-4 pt-6">
                    <button type="button" id="cancel-bulk-import" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">キャンセル</button>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition">一括登録を実行</button>
                </div>
            </form>
        </div>
    </div>
    <div id="confirm-dialog" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden modal-transition opacity-0 z-50">
        <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-700 transform scale-95 modal-transition">
            <h3 id="confirm-title" class="text-xl font-semibold mb-4 text-white">確認</h3>
            <p id="confirm-message" class="text-gray-300 mb-6"></p>
            <div id="confirm-buttons" class="flex justify-end gap-4"></div>
        </div>
    </div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
        import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
        
        // --- DOM Elements ---
        const configModal = document.getElementById('firebase-config-modal');
        const mainAppContainer = document.getElementById('main-app');
        const statusIndicator = document.getElementById('status-indicator');
        const dataIdDisplay = document.getElementById('data-id-display');
        const dbErrorMessage = document.getElementById('db-error-message');
        const masterModal = document.getElementById('master-modal');
        const employeeListModal = document.getElementById('employee-list-modal');
        const editModal = document.getElementById('edit-modal');
        const pathInfoModal = document.getElementById('path-info-modal');
        const masterCsvImportInput = document.getElementById('master-csv-import-input');
        const employeeCsvImportInput = document.getElementById('employee-csv-import-input');

        // --- Global variables ---
        let db;
        let collections = {};
        let workItemsCache = [];
        let activeEditForm = null;

        // --- Firebase Initialization ---
        async function initializeAppAndServices(firebaseConfig, dataId) {
             try {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                db = getFirestore(app);

                await signInAnonymously(auth);

                if (!auth.currentUser) throw new Error("Authentication failed.");
                
                statusIndicator.textContent = '接続成功！';
                statusIndicator.className = 'mt-2 text-sm text-green-400';
                dataIdDisplay.textContent = `データID: ${dataId}`;
                
                const basePath = `artifacts/${dataId}/public/data`;

                collections = {
                    employees: collection(db, `${basePath}/employees`),
                    stores: collection(db, `${basePath}/stores`),
                    roles: collection(db, `${basePath}/roles`),
                    fixtures: collection(db, `${basePath}/fixtures`),
                    work_types: collection(db, `${basePath}/work_types`),
                    work_items: collection(db, `${basePath}/work_items`),
                    work_times: collection(db, `${basePath}/work_times`),
                    product_categories: collection(db, `${basePath}/product_categories`),
                    events: collection(db, `${basePath}/events`),
                    skill_categories: collection(db, `${basePath}/skill_categories`),
                    skill_checks: collection(db, `${basePath}/skill_checks`),
                    toilet_cleaning: collection(db, `${basePath}/toilet_cleaning`),
                    handovers: collection(db, `${basePath}/handovers`),
                    haccp: collection(db, `${basePath}/haccp`),
                };
                
                setupEventListeners();
                fetchAllData(); 
                setupMasterTabs();
                setupMainMasterTabs();
                setupEmployeeTabs();
                populatePathInfo(dataId);

                configModal.classList.add('hidden');
                mainAppContainer.classList.remove('hidden');

            } catch (error) {
                console.error("Firebase Initialization/Auth failed:", error);
                statusIndicator.textContent = '接続失敗';
                showConfigModal(error.message);
            }
        }
        
        function showConfigModal(errorMessage = '') {
             configModal.classList.remove('hidden');
             mainAppContainer.classList.add('hidden');
             const configError = document.getElementById('config-error');
             if(errorMessage) {
                 configError.textContent = `エラー: ${errorMessage} 設定を確認してください。`;
                 configError.classList.remove('hidden');
             }
        }

        // --- App Startup ---
        document.addEventListener('DOMContentLoaded', () => {
            // ▼▼▼▼▼ USER PROVIDED FIREBASE CONFIG ▼▼▼▼▼
            const firebaseConfig = {
                apiKey: "AIzaSyAvxKaj49CfK9T5-h4AycKcguU2gsSXTxc",
                authDomain: "new-check-137f9.firebaseapp.com",
                projectId: "new-check-137f9",
                storageBucket: "new-check-137f9.appspot.com",
                messagingSenderId: "534868750946",
                appId: "1:534868750946:web:f34f6ebc50e3eb07d8573b",
                measurementId: "G-WR87PJRFM1"
            };
            // ▲▲▲▲▲ USER PROVIDED FIREBASE CONFIG ▲▲▲▲▲
            
            const dataId = "general-master-data"; 

            initializeAppAndServices(firebaseConfig, dataId);
            createDayOfWeekCheckboxes('add-work-item-days');
            createDayOfWeekCheckboxes('edit-work-item-days');
            
            // Fallback form for manual configuration if initial connection fails
            const configForm = document.getElementById('firebase-config-form');
            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const manualDataId = document.getElementById('data-id-input').value.trim();
                const configText = document.getElementById('firebase-config-input').value.trim();
                const objectStr = configText.replace(/^const\s+firebaseConfig\s*=\s*/, '').replace(/;$/, '');
                try {
                    const manualConfig = new Function(`return ${objectStr}`)();
                    initializeAppAndServices(manualConfig, manualDataId);
                } catch (error) {
                    showConfigModal('設定情報の解析に失敗しました: ' + error.message);
                }
            });
        });

        // --- Event Listeners Setup ---
        function setupEventListeners() {
            // Main App Forms
            document.getElementById('add-employee-form').addEventListener('submit', addEmployee);
            document.getElementById('show-bulk-import-btn').addEventListener('click', () => showModal(document.getElementById('bulk-import-modal')));
            document.getElementById('cancel-bulk-import').addEventListener('click', () => hideModal(document.getElementById('bulk-import-modal')));
            document.getElementById('bulk-import-form').addEventListener('submit', handleBulkImport);
            
            // Master Add Forms
            document.getElementById('add-store-form').addEventListener('submit', (e) => addMasterItem(e, 'new-store-name', collections.stores, {name: document.getElementById('new-store-name').value}));
            document.getElementById('add-role-form').addEventListener('submit', (e) => addMasterItem(e, 'new-role-name', collections.roles, {name: document.getElementById('new-role-name').value}));
            document.getElementById('add-fixture-form').addEventListener('submit', addFixture);
            document.getElementById('add-work-type-form').addEventListener('submit', (e) => addMasterItem(e, 'new-work-type-name', collections.work_types, {name: document.getElementById('new-work-type-name').value}));
            document.getElementById('add-work-item-form').addEventListener('submit', addWorkItem);
            document.getElementById('add-work-time-form').addEventListener('submit', addWorkTime);
            document.getElementById('add-product-category-form').addEventListener('submit', (e) => addMasterItem(e, 'new-product-category-name', collections.product_categories, {name: document.getElementById('new-product-category-name').value}));
            document.getElementById('add-event-form').addEventListener('submit', (e) => addMasterItem(e, 'new-event-name', collections.events, {name: document.getElementById('new-event-name').value}));
            document.getElementById('add-skill-category-form').addEventListener('submit', (e) => addMasterItem(e, 'new-skill-category-name', collections.skill_categories, {name: document.getElementById('new-skill-category-name').value}));
            document.getElementById('add-skill-check-form').addEventListener('submit', addSkillCheck);
            document.getElementById('add-toilet-cleaning-form').addEventListener('submit', (e) => addMasterItem(e, 'new-toilet-cleaning-name', collections.toilet_cleaning, {name: document.getElementById('new-toilet-cleaning-name').value}));
            document.getElementById('add-handover-form').addEventListener('submit', (e) => addMasterItem(e, 'new-handover-name', collections.handovers, {name: document.getElementById('new-handover-name').value}));
            document.getElementById('add-haccp-form').addEventListener('submit', (e) => addMasterItem(e, 'new-haccp-name', collections.haccp, {name: document.getElementById('new-haccp-name').value}));

            // Modal Navigation & CSV
            document.getElementById('show-master-modal-btn').addEventListener('click', () => showModal(masterModal));
            document.getElementById('close-master-modal-btn').addEventListener('click', () => hideModal(masterModal));
            document.getElementById('export-master-csv-btn').addEventListener('click', exportActiveMasterToCSV);
            document.getElementById('import-master-csv-btn').addEventListener('click', () => masterCsvImportInput.click());
            masterCsvImportInput.addEventListener('change', importCSVToActiveMaster);

            document.getElementById('show-employee-list-modal-btn').addEventListener('click', () => showModal(employeeListModal));
            document.getElementById('close-employee-list-modal-btn').addEventListener('click', () => hideModal(employeeListModal));
            document.getElementById('export-employees-csv-btn').addEventListener('click', exportEmployeesToCSV);
            document.getElementById('import-employees-csv-btn').addEventListener('click', () => employeeCsvImportInput.click());
            employeeCsvImportInput.addEventListener('change', importEmployeesFromCSV);
            document.getElementById('deduplicate-employees-btn').addEventListener('click', deduplicateEmployees);


            document.getElementById('show-path-info-modal-btn').addEventListener('click', () => showModal(pathInfoModal));
            document.getElementById('close-path-info-modal-btn').addEventListener('click', () => hideModal(pathInfoModal));

            document.getElementById('cancel-edit').addEventListener('click', () => {
                hideModal(editModal);
                if (activeEditForm && activeEditForm.id.includes('employee')) {
                    showModal(employeeListModal);
                } else {
                    showModal(masterModal);
                }
            });
            document.getElementById('save-edit-btn').addEventListener('click', () => {
                if (activeEditForm) {
                    activeEditForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            });

            // List Action Delegation
            masterModal.addEventListener('click', handleMasterListAction);
            employeeListModal.addEventListener('click', (e) => handleListAction(e, 'employees'));
            document.getElementById('edit-employee-form').addEventListener('submit', updateEmployee);
            document.getElementById('edit-work-item-form').addEventListener('submit', updateWorkItem);
            document.getElementById('edit-work-time-form').addEventListener('submit', updateWorkTime);
            document.getElementById('edit-role-skills-form').addEventListener('submit', updateRoleSkills);
            document.getElementById('edit-fixture-form').addEventListener('submit', updateFixture);
            document.getElementById('edit-skill-check-form').addEventListener('submit', updateSkillCheck);
            document.getElementById('edit-simple-master-form').addEventListener('submit', updateSimpleMaster);
        }
        
        function handleDbError(isError) {
             dbErrorMessage.classList.toggle('hidden', !isError);
             document.querySelectorAll('#main-app input, #main-app select, #main-app button').forEach(el => el.disabled = isError);
             if(isError) {
                statusIndicator.textContent = 'データベースエラー';
                statusIndicator.className = 'mt-2 text-sm text-red-500';
             } else {
                 statusIndicator.textContent = '接続成功！';
                 statusIndicator.className = 'mt-2 text-sm text-green-400';
             }
        }
        
        function setupMasterTabs() {
            const tabsContainer = document.getElementById('master-tabs');
            if (!tabsContainer) return;
            const contentPanes = masterModal.querySelectorAll('.master-tab-content');
            tabsContainer.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') return;
                e.preventDefault();
                tabsContainer.querySelectorAll('a').forEach(t => t.classList.remove('active', 'border-purple-400', 'text-purple-300'));
                e.target.classList.add('active', 'border-purple-400', 'text-purple-300');
                contentPanes.forEach(p => p.classList.add('hidden'));
                const targetId = e.target.getAttribute('href').substring(1);
                document.getElementById(targetId)?.classList.remove('hidden');
            });
            tabsContainer.querySelector('a')?.click();
        }

        function setupMainMasterTabs() {
             const tabsContainer = document.getElementById('main-master-tabs');
              if (!tabsContainer) return;
            const contentPanes = document.querySelectorAll('#main-master-tab-content-container > div');
            tabsContainer.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') return;
                e.preventDefault();
                tabsContainer.querySelectorAll('a').forEach(t => t.classList.remove('active', 'border-purple-400', 'text-purple-300'));
                e.target.classList.add('active', 'border-purple-400', 'text-purple-300');
                contentPanes.forEach(p => p.classList.add('hidden'));
                const targetId = e.target.getAttribute('href').substring(1);
                document.getElementById(targetId)?.classList.remove('hidden');
            });
            tabsContainer.querySelector('a')?.click();
        }
        
        function setupEmployeeTabs() {
            const tabsContainer = document.getElementById('employee-tabs');
            if (!tabsContainer) return;
            const contentPanes = employeeListModal.querySelectorAll('.employee-tab-content');
            tabsContainer.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') return;
                e.preventDefault();
                tabsContainer.querySelectorAll('a').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                contentPanes.forEach(p => p.classList.add('hidden'));
                const targetId = e.target.getAttribute('href').substring(1);
                document.getElementById(targetId)?.classList.remove('hidden');
            });
            tabsContainer.querySelector('a')?.click();
        }

        async function fetchAllData() {
            try {
                await Promise.all([
                    fetchMasterData(),
                    fetchEmployees()
                ]);
                handleDbError(false);
            } catch (error) {
                console.error("Error fetching all data:", error);
                handleDbError(true);
            }
        }
        
        async function fetchMasterData() {
            const masterConfigs = [
                { id: 'stores', collection: collections.stores, listId: 'store-master-list' },
                { id: 'roles', collection: collections.roles, listId: 'role-master-list' },
                { id: 'fixtures', collection: collections.fixtures, listId: 'fixture-master-list' },
                { id: 'work_types', collection: collections.work_types, listId: 'work-type-master-list' },
                { id: 'work_items', collection: collections.work_items, listId: 'work-item-master-list' },
                { id: 'work_times', collection: collections.work_times, listId: 'work-times-master-list' },
                { id: 'product_categories', collection: collections.product_categories, listId: 'product-category-master-list' },
                { id: 'events', collection: collections.events, listId: 'event-master-list' },
                { id: 'skill_categories', collection: collections.skill_categories, listId: 'skill-category-master-list'},
                { id: 'skill_checks', collection: collections.skill_checks, listId: 'skill-check-master-list' },
                { id: 'toilet_cleaning', collection: collections.toilet_cleaning, listId: 'toilet-cleaning-master-list' },
                { id: 'handovers', collection: collections.handovers, listId: 'handover-master-list' },
                { id: 'haccp', collection: collections.haccp, listId: 'haccp-master-list' },
            ];
             
            const promises = masterConfigs.map(config => getDocs(config.collection));
            const snapshots = await Promise.all(promises);

            snapshots.forEach((snapshot, index) => {
                const config = masterConfigs[index];
                const items = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                 
                if (config.id === 'work_items') {
                    workItemsCache = items;
                }
                
                if (config.id === 'stores') {
                    updateDropdowns(document.getElementById('store'), items);
                    updateDropdowns(document.getElementById('edit-store'), items);
                } else if (config.id === 'roles') {
                     updateDropdowns(document.getElementById('role'), items);
                     updateDropdowns(document.getElementById('edit-role'), items);
                } else if(config.id === 'work_types') {
                    updateWorkTypeCheckboxes(document.getElementById('work-type-checkboxes'), items);
                    updateWorkTypeCheckboxes(document.getElementById('edit-work-type-checkboxes'), items);
                } else if (config.id === 'skill_categories') {
                    updateDropdowns(document.getElementById('skill-category-select'), items);
                    updateDropdowns(document.getElementById('edit-skill-category-select'), items);
                }
                
                const tabContentEl = document.getElementById(`master-tab-content-${config.id.replace(/_/g, '-')}`);
                if(tabContentEl) updateMasterList(tabContentEl, items, config.collection);
            });
        }
        
        function updateWorkTypeCheckboxes(container, workTypes) {
            container.innerHTML = '';
            if (workTypes.length === 0) {
                 container.innerHTML = `<p class="text-gray-500 text-sm">作業種類を先に登録してください</p>`;
                 return;
            }
            workTypes.forEach(type => {
                const label = document.createElement('label');
                label.className = 'flex items-center space-x-2 text-sm cursor-pointer';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = type.name;
                checkbox.className = 'form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-pink-500 focus:ring-pink-500';
                label.appendChild(checkbox);
                const span = document.createElement('span');
                span.textContent = type.name;
                label.appendChild(span);
                container.appendChild(label);
            });
        }

        function updateMasterList(listElement, items, collectionRef) {
            if (!listElement) return;

            const fieldsMapping = {
                'stores': ['name'],
                'roles': ['name', 'assigned_tasks'],
                'fixtures': ['name', 'manufacturer', 'model_number', 'model_type', 'temp_min', 'temp_max', 'manual_drain'],
                'work_types': ['name'],
                'work_items': ['name', 'associated_types', 'days_of_week', 'appropriate_time'],
                'work_times': ['name', 'category', 'standard_time'],
                'product_categories': ['name'],
                'events': ['name'],
                'skill_categories': ['name'],
                'skill_checks': ['name', 'category'],
                'toilet_cleaning': ['name'],
                'handovers': ['name'],
                'haccp': ['name'],
            };
            
            const collectionName = collectionRef.id.split('/').pop();
            const fields = fieldsMapping[collectionName];

            if (!fields) {
                console.error("No fields configuration found for collection:", collectionName);
                return;
            }

            const targetList = listElement.querySelector('ul, tbody') || listElement;
            const isTable = targetList.tagName === 'TBODY';
            targetList.innerHTML = ''; 

            if (items.length === 0) {
                if(isTable) {
                    const colSpan = targetList.closest('table').querySelector('thead tr').children.length;
                    targetList.innerHTML = `<tr class="bg-gray-800"><td colspan="${colSpan}" class="text-center p-4 text-gray-500">データがありません</td></tr>`;
                } else {
                    targetList.innerHTML = `<li class="text-gray-500 text-sm px-2">データがありません</li>`;
                }
                return;
            }

            const sortedItems = items.sort((a,b) => (a.name > b.name) ? 1 : -1);
            
            sortedItems.forEach(item => {
                const parentEl = isTable ? document.createElement('tr') : document.createElement('li');
                parentEl.className = isTable ? 'bg-gray-800 border-b border-gray-700' : 'flex justify-between items-center bg-gray-700 p-2 rounded-md text-sm';
                parentEl.dataset.id = item.id;
                
                let contentHTML = '';
                
                fields.forEach(field => {
                    let value = item[field];
                     if (field === 'manual_drain') {
                         value = value ? '要' : '不要';
                    } else if (field === 'associated_types' || field === 'assigned_tasks') {
                        const tagColor = field === 'associated_types' ? 'bg-rose-800 text-rose-300' : 'bg-purple-800 text-purple-300';
                        value = (item[field] || []).map(t => `<span class="inline-block ${tagColor} text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${t}</span>`).join('');
                    } else if (field === 'days_of_week') {
                        value = (item[field] || []).map(d => `<span class="inline-block bg-gray-600 text-gray-200 text-xs font-medium mr-1 px-2 py-0.5 rounded">${d}</span>`).join(' ');
                    } else if (field ==='category'){
                        value = item.category || '未分類'
                    }
                    if(isTable) {
                         contentHTML += `<td class="px-4 py-2">${value || ''}</td>`;
                    } else {
                         contentHTML += `<span class="data-span data-span-name">${item.name}</span>`;
                    }
                });
               
                parentEl.innerHTML = contentHTML;
                const actionsCell = document.createElement(isTable ? 'td' : 'div');
                actionsCell.className = isTable ? 'px-4 py-2 text-center' : 'flex items-center gap-3 ml-4';
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex items-center justify-center gap-3';
                
                createActionButtons(buttonContainer, item, collectionRef);
                actionsCell.appendChild(buttonContainer);
                parentEl.appendChild(actionsCell);
                targetList.appendChild(parentEl);
            });
        }
        
        function createActionButtons(container, item, collectionRef) {
            const editBtn = document.createElement('button');
            editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>`;
            editBtn.className = 'edit-btn text-gray-400 hover:text-orange-400 transition';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
            deleteBtn.className = 'delete-btn text-gray-400 hover:text-red-500 transition';

            if (collectionRef.id.endsWith('roles')) {
                const skillBtn = document.createElement('button');
                skillBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M11.996 4.093a1 1 0 00-1.992 0l-1.465 5.125a1 1 0 00.384 1.104l4.062 2.954a.5.5 0 00.62-.055l.001-.001a.5.5 0 00.057-.62l-2.954-4.062a1 1 0 00-1.104-.384l-5.125 1.465a1 1 0 000 1.992l5.125-1.465a1 1 0 001.104.384l2.954 4.062a.5.5 0 00.62.056l.001.001a.5.5 0 00.057-.62l-4.062-2.954a1 1 0 00-.384-1.104l1.465-5.125z" /></svg>`;
                skillBtn.className = 'skill-btn text-gray-400 hover:text-blue-400 transition';
                skillBtn.title = "スキル設定";
                container.append(skillBtn);
            }

            container.append(editBtn, deleteBtn);
        }
        
        function getCollectionFromList(listElement) {
            if (!listElement) return null;
            const id = listElement.closest('.master-tab-content')?.id.replace('master-tab-content-','') || listElement.id.replace('-master-list','');
            return collections[id.replace(/-/g, '_')];
        }

        function handleMasterListAction(e) {
            const parentEl = e.target.closest('li, tr');
            if (!parentEl) return;
            
            const collectionRef = getCollectionFromList(parentEl.parentElement);
            if(!collectionRef) return;
            
            const id = parentEl.dataset.id;
            const name = parentEl.querySelector('.data-span-name')?.textContent || parentEl.cells[0].textContent;

            if (e.target.closest('.delete-btn')) {
                 deleteMasterItem(id, name, collectionRef);
            } else if (e.target.closest('.edit-btn')) {
                hideModal(masterModal);
                if (collectionRef.id.endsWith('work_items')) showEditWorkItemModal(id);
                else if (collectionRef.id.endsWith('work_times')) showEditWorkTimeModal(id);
                else if (collectionRef.id.endsWith('fixtures')) showEditFixtureModal(id);
                else if (collectionRef.id.endsWith('skill_checks')) showEditSkillCheckModal(id);
                else showEditSimpleMasterModal(id, collectionRef, name);
            } else if (e.target.closest('.skill-btn')) {
                hideModal(masterModal);
                showRoleSkillsModal(id, name);
            }
        }
        
        function handleListAction(e, type) {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            if (!editBtn && !deleteBtn) return;

            const id = editBtn?.dataset.id || deleteBtn?.dataset.id;
            const parentElement = (editBtn || deleteBtn)?.closest('li, tr');
            const name = parentElement?.querySelector('.data-span-name')?.textContent;

            if (editBtn) {
                 hideModal(employeeListModal); 
                 showEditModal(id);
            }
            if (deleteBtn) {
                 deleteEmployee(id, name);
            }
        }
        
        async function fetchEmployees() {
            const snapshot = await getDocs(collections.employees);
            
            const today = new Date().toISOString().split('T')[0];

            let employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const activeEmployees = [];
            const retiredEmployees = [];

            employees.forEach(emp => {
                if (emp.retirementDate && emp.retirementDate <= today) {
                    retiredEmployees.push(emp);
                } else {
                    activeEmployees.push(emp);
                }
            });
            
            const sortByKana = (a, b) => {
                const aKana = `${a.lastName_kana || ''}${a.firstName_kana || ''}`;
                const bKana = `${b.lastName_kana || ''}${b.firstName_kana || ''}`;
                return aKana.localeCompare(bKana, 'ja');
            };
            
            activeEmployees.sort(sortByKana);
            retiredEmployees.sort(sortByKana);

            populateEmployeeList(document.getElementById('active-employee-list'), activeEmployees, false);
            populateEmployeeList(document.getElementById('retired-employee-list'), retiredEmployees, true);
        }

        function populateEmployeeList(listElement, employees, isRetiredList) {
            listElement.innerHTML = '';
            if (employees.length === 0) {
                const colSpan = 11;
                const message = isRetiredList ? '退職済みの従業員はいません。' : '従業員が登録されていません。';
                listElement.innerHTML = `<tr class="bg-gray-800"><td colspan="${colSpan}" class="text-center p-8 text-gray-400">${message}</td></tr>`;
                return;
            }

            employees.forEach(employee => {
                const isRetired = employee.retirementDate && new Date(employee.retirementDate) <= new Date(new Date().setHours(0,0,0,0));
                const tr = document.createElement('tr');
                tr.className = `bg-gray-800 border-b border-gray-700 hover:bg-gray-700 transition-colors ${isRetired ? 'text-gray-500 opacity-70' : ''}`;
                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium ${isRetired ? '' : 'text-white'} data-span-name">${employee.lastName || ''} ${employee.firstName || ''}</td>
                    <td class="px-6 py-4">${employee.lastName_kana || ''} ${employee.firstName_kana || ''}</td>
                    <td class="px-6 py-4">${employee.nickname || ''}</td>
                    <td class="px-6 py-4">${employee.email || ''}</td>
                    <td class="px-6 py-4">${employee.employeeId}</td>
                    <td class="px-6 py-4">${employee.pincode || ''}</td>
                    <td class="px-6 py-4">${employee.store}</td>
                    <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(employee.role)}">${employee.role}</span></td>
                    <td class="px-6 py-4">${employee.hourly_wage || ''}</td>
                    <td class="px-6 py-4">${employee.retirementDate || ''}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="edit-btn font-medium text-orange-400 hover:text-orange-300 mr-4" data-id="${employee.id}">編集</button>
                        <button class="delete-btn font-medium text-red-500 hover:text-red-400" data-id="${employee.id}">削除</button>
                    </td>`;
                listElement.appendChild(tr);
            });
        }


        async function addEmployee(e) {
            e.preventDefault();
            const form = e.target;
            if (!form.store.value || !form.role.value) {
                showAlert('入力エラー', '所属店舗と役職を選択してください。\nマスタデータが未登録の場合は、「マスタ管理」画面から登録してください。');
                return;
            }
            try {
                await addDoc(collections.employees, {
                    lastName: form.lastName.value,
                    firstName: form.firstName.value,
                    lastName_kana: form.lastName_kana.value,
                    firstName_kana: form.firstName_kana.value,
                    nickname: form.nickname.value,
                    email: form.email.value,
                    employeeId: form.employeeId.value,
                    pincode: form.pincode.value,
                    hourly_wage: form.hourly_wage.value,
                    retirementDate: form.retirementDate.value || null,
                    store: form.store.value,
                    role: form.role.value,
                    createdAt: serverTimestamp()
                });
                form.reset();
                showAlert('成功', '新しい従業員を登録しました。');
                fetchEmployees();
            } catch (error) {
                console.error("Error adding employee: ", error);
                showAlert("エラー", "従業員の追加に失敗しました。");
            }
        }
        
        function prepareEditModal(formContainerId, title) {
            ['employee', 'work-item', 'work-time', 'role-skills', 'fixture', 'simple-master', 'skill-check'].forEach(type => {
                const el = document.getElementById(`edit-${type}-form-container`);
                if(el) el.classList.add('hidden');
            });
            const targetForm = document.getElementById(formContainerId);
            if(targetForm) targetForm.classList.remove('hidden');
            document.getElementById('edit-modal-title').textContent = title;
            activeEditForm = targetForm.querySelector('form');
        }

        async function showEditModal(id) {
            prepareEditModal('edit-employee-form-container', '従業員情報の編集');
            const docRef = doc(collections.employees, id);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const employee = docSnap.data();
                    const form = document.getElementById('edit-employee-form');
                    form['edit-doc-id'].value = id;
                    form['edit-lastName'].value = employee.lastName || '';
                    form['edit-firstName'].value = employee.firstName || '';
                    form['edit-lastName_kana'].value = employee.lastName_kana || '';
                    form['edit-firstName_kana'].value = employee.firstName_kana || '';
                    form['edit-nickname'].value = employee.nickname || '';
                    form['edit-email'].value = employee.email || '';
                    form['edit-employeeId'].value = employee.employeeId || '';
                    form['edit-pincode'].value = employee.pincode || '';
                    form['edit-hourly_wage'].value = employee.hourly_wage || '';
                    form['edit-retirementDate'].value = employee.retirementDate || '';
                    form['edit-store'].value = employee.store || '';
                    form['edit-role'].value = employee.role || '';
                    showModal(editModal);
                }
            } catch (error) {
                console.error("Error getting employee data: ", error);
                showAlert("エラー", "従業員データの取得に失敗しました。");
            }
        }
        
         async function showEditWorkItemModal(id) {
            prepareEditModal('edit-work-item-form-container', '作業項目の編集');
            const docRef = doc(collections.work_items, id);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const workItem = docSnap.data();
                    const form = document.getElementById('edit-work-item-form');
                    form['edit-work-item-doc-id'].value = id;
                    form['edit-work-item-name'].value = workItem.name || '';
                    form['edit-work-item-time'].value = workItem.appropriate_time || '';
                    
                    const typeCheckboxes = document.querySelectorAll('#edit-work-type-checkboxes input[type="checkbox"]');
                    typeCheckboxes.forEach(cb => {
                        cb.checked = (workItem.associated_types || []).includes(cb.value);
                    });
                    
                    const dayCheckboxesContainer = document.getElementById('edit-work-item-days');
                    const dayCheckboxes = Array.from(dayCheckboxesContainer.querySelectorAll('.day-checkbox'));
                    const everydayCheckbox = dayCheckboxesContainer.querySelector('.everyday-checkbox');
                    
                    dayCheckboxes.forEach(cb => cb.checked = false);

                    (workItem.days_of_week || []).forEach(day => {
                        const cb = dayCheckboxes.find(c => c.value === day);
                        if (cb) cb.checked = true;
                    });
                    
                    everydayCheckbox.checked = dayCheckboxes.every(cb => cb.checked);

                    showModal(editModal);
                }
            } catch (error) {
                console.error("Error getting work item data: ", error);
                showAlert("エラー", "作業項目データの取得に失敗しました。");
            }
        }

        async function showRoleSkillsModal(roleId, roleName) {
            prepareEditModal('edit-role-skills-form-container', `「${roleName}」のスキル設定`);

            const docRef = doc(collections.roles, roleId);
            try {
                const docSnap = await getDoc(docRef);
                const role = docSnap.data();
                const assignedTasks = role.assigned_tasks || [];
                
                const container = document.getElementById('edit-role-skills-checkboxes');
                container.innerHTML = '';

                if (workItemsCache.length === 0) {
                    container.innerHTML = '<p class="text-gray-400">登録済みの作業項目がありません。</p>';
                } else {
                     workItemsCache.forEach(item => {
                        const label = document.createElement('label');
                        label.className = 'flex items-center space-x-2 text-sm cursor-pointer';
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.value = item.name;
                        checkbox.checked = assignedTasks.includes(item.name);
                        checkbox.className = 'form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-purple-500 focus:ring-purple-500';
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(item.name));
                        container.appendChild(label);
                    });
                }
                
                document.getElementById('edit-role-skills-form').dataset.roleId = roleId;
                showModal(editModal);

            } catch(e) {
                console.error("Error showing role skills modal", e);
                showAlert('エラー', 'スキル設定画面の表示に失敗しました。');
            }
        }
        
         async function showEditFixtureModal(id) {
            prepareEditModal('edit-fixture-form-container', '什器情報の編集');
            
            const docRef = doc(collections.fixtures, id);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const fixture = docSnap.data();
                    const form = document.getElementById('edit-fixture-form');
                    form['edit-fixture-doc-id'].value = id;
                    form['edit-fixture-name'].value = fixture.name || '';
                    form['edit-fixture-manufacturer'].value = fixture.manufacturer || '';
                    form['edit-fixture-model-number'].value = fixture.model_number || '';
                    form['edit-fixture-model-type'].value = fixture.model_type || '';
                    form['edit-fixture-temp-min'].value = fixture.temp_min || '';
                    form['edit-fixture-temp-max'].value = fixture.temp_max || '';
                    form['edit-fixture-manual-drain'].checked = fixture.manual_drain || false;
                    showModal(editModal);
                }
            } catch (error) {
                console.error("Error getting fixture data: ", error);
                showAlert("エラー", "什器データの取得に失敗しました。");
            }
        }
        
        async function showEditSimpleMasterModal(id, collectionRef, name) {
            prepareEditModal('edit-simple-master-form-container', `「${name}」の編集`);
            const form = document.getElementById('edit-simple-master-form');
            form.dataset.docId = id;
            form.dataset.collectionId = collectionRef.id;
            form['edit-simple-master-name'].value = name;
            showModal(editModal);
        }
        
        async function showEditWorkTimeModal(id) {
            prepareEditModal('edit-work-time-form-container', '作業時間の編集');
            const docRef = doc(collections.work_times, id);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const workTime = docSnap.data();
                    const form = document.getElementById('edit-work-time-form');
                    form['edit-work-time-doc-id'].value = id;
                    form['edit-work-time-name'].value = workTime.name || '';
                    form['edit-work-time-category'].value = workTime.category || '';
                    form['edit-work-time-standard-time'].value = workTime.standard_time || '';
                    showModal(editModal);
                }
            } catch (error) {
                console.error("Error getting work time data: ", error);
                showAlert("エラー", "作業時間データの取得に失敗しました。");
            }
        }
        
        async function showEditSkillCheckModal(id) {
            prepareEditModal('edit-skill-check-form-container', '習得確認項目の編集');
            const docRef = doc(collections.skill_checks, id);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const skillCheck = docSnap.data();
                    const form = document.getElementById('edit-skill-check-form');
                    form['edit-skill-check-doc-id'].value = id;
                    form['edit-skill-check-name'].value = skillCheck.name || '';
                    form['edit-skill-category-select'].value = skillCheck.category || '';
                    showModal(editModal);
                }
            } catch (error) {
                console.error("Error getting skill check data: ", error);
                showAlert("エラー", "習得確認項目の取得に失敗しました。");
            }
        }

        async function updateEmployee(e) {
            e.preventDefault();
            const form = e.target;
            const id = form['edit-doc-id'].value;
            const employeeDoc = doc(collections.employees, id);
            try {
                await updateDoc(employeeDoc, {
                    lastName: form['edit-lastName'].value,
                    firstName: form['edit-firstName'].value,
                    lastName_kana: form['edit-lastName_kana'].value,
                    firstName_kana: form['edit-firstName_kana'].value,
                    nickname: form['edit-nickname'].value,
                    email: form['edit-email'].value,
                    employeeId: form['edit-employeeId'].value,
                    pincode: form['edit-pincode'].value,
                    hourly_wage: form['edit-hourly_wage'].value,
                    retirementDate: form['edit-retirementDate'].value || null,
                    store: form['edit-store'].value,
                    role: form['edit-role'].value,
                });
                hideModal(editModal);
                fetchEmployees();
            } catch (error) {
                console.error("Error updating employee: ", error);
                showAlert("エラー", "更新に失敗しました。");
            }
        }
        
        async function updateWorkItem(e) {
             e.preventDefault();
            const form = e.target;
            const id = form['edit-work-item-doc-id'].value;
            const workItemDoc = doc(collections.work_items, id);
            
            const newName = form['edit-work-item-name'].value.trim();
            const time = form['edit-work-item-time'].value;
            const selectedTypes = Array.from(document.querySelectorAll('#edit-work-type-checkboxes input:checked')).map(cb => cb.value);
            const selectedDays = Array.from(document.querySelectorAll('#edit-work-item-days input.day-checkbox:checked')).map(cb => cb.value);

            if (!newName) {
                showAlert('エラー', '作業項目名は必須です。');
                return;
            }

            try {
                await updateDoc(workItemDoc, {
                    name: newName,
                    appropriate_time: time ? parseInt(time, 10) : null,
                    associated_types: selectedTypes,
                    days_of_week: selectedDays
                });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal); 
            } catch (error) {
                console.error("Error updating work item:", error);
                showAlert("エラー", "作業項目の更新に失敗しました。");
            }
        }
        
         async function updateRoleSkills(e) {
            e.preventDefault();
            const form = e.target;
            const roleId = form.dataset.roleId;
            const roleDoc = doc(collections.roles, roleId);
            const selectedTasks = Array.from(document.querySelectorAll('#edit-role-skills-checkboxes input:checked')).map(cb => cb.value);

            try {
                await updateDoc(roleDoc, {
                    assigned_tasks: selectedTasks
                });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal); 
            } catch (error) {
                console.error("Error updating role skills:", error);
                showAlert("エラー", "スキル設定の更新に失敗しました。");
            }
        }
        
        async function updateFixture(e) {
             e.preventDefault();
            const form = e.target;
            const id = form['edit-fixture-doc-id'].value;
            const fixtureDoc = doc(collections.fixtures, id);
            
            try {
                await updateDoc(fixtureDoc, {
                    name: form['edit-fixture-name'].value,
                    manufacturer: form['edit-fixture-manufacturer'].value,
                    model_number: form['edit-fixture-model-number'].value,
                    model_type: form['edit-fixture-model-type'].value,
                    temp_min: form['edit-fixture-temp-min'].value,
                    temp_max: form['edit-fixture-temp-max'].value,
                    manual_drain: form['edit-fixture-manual-drain'].checked,
                });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal); 
            } catch (error) {
                console.error("Error updating fixture:", error);
                showAlert("エラー", "什器情報の更新に失敗しました。");
            }
        }

        async function updateWorkTime(e) {
            e.preventDefault();
            const form = e.target;
            const id = form['edit-work-time-doc-id'].value;
            const workTimeDoc = doc(collections.work_times, id);

            const name = form['edit-work-time-name'].value.trim();
            const category = form['edit-work-time-category'].value.trim();
            const standard_time = form['edit-work-time-standard-time'].value;

            if (!name || !category || !standard_time) {
                showAlert('エラー', 'すべてのフィールドを入力してください。');
                return;
            }

            try {
                await updateDoc(workTimeDoc, {
                    name,
                    category,
                    standard_time: parseInt(standard_time, 10),
                });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal);
            } catch (error) {
                console.error("Error updating work time:", error);
                showAlert("エラー", "作業時間の更新に失敗しました。");
            }
        }
        
        async function updateSimpleMaster(e) {
            e.preventDefault();
            const form = e.target;
            const id = form.dataset.docId;
            const collectionPath = form.dataset.collectionId;
            const collectionRef = collection(db, collectionPath);
            const newName = form['edit-simple-master-name'].value.trim();

            if(!newName) {
                showAlert('エラー', '項目名は必須です。');
                return;
            }

            try {
                await updateDoc(doc(collectionRef, id), { name: newName });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal);
            } catch(error) {
                console.error("Error updating simple master:", error);
                showAlert("エラー", "項目の更新に失敗しました。");
            }
        }
        
         async function updateSkillCheck(e) {
            e.preventDefault();
            const form = e.target;
            const id = form['edit-skill-check-doc-id'].value;
            const skillCheckDoc = doc(collections.skill_checks, id);
            
            const newName = form['edit-skill-check-name'].value.trim();
            const category = form['edit-skill-category-select'].value;

            if (!newName) { showAlert('エラー','習得確認項目名を入力してください。'); return; }
             if (!category) { showAlert('エラー','所属する習得カテゴリを選択してください。'); return; }

            try {
                await updateDoc(skillCheckDoc, {
                    name: newName,
                    category: category
                });
                hideModal(editModal);
                fetchMasterData();
                showModal(masterModal); 
            } catch (error) {
                console.error("Error updating skill check:", error);
                showAlert("エラー", "習得確認項目の更新に失敗しました。");
            }
        }

        async function deleteEmployee(id, name) {
            showConfirmDialog(`従業員「${name}」を削除しますか？`, async () => {
                try {
                    await deleteDoc(doc(collections.employees, id));
                    fetchEmployees();
                } catch (error) {
                    console.error("Error deleting employee: ", error);
                    showAlert("エラー", "削除に失敗しました。");
                }
            });
        }
        
        async function handleBulkImport(e) {
            e.preventDefault();
            const csvData = document.getElementById('csv-data').value.trim();
            const lines = csvData.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                showAlert("情報", "登録するデータがありません。");
                return;
            }
            const batch = writeBatch(db);
            let errorCount = 0;
            lines.forEach(line => {
                const values = line.split(',').map(v => v.trim());
                if (values.length >= 10) { // Allow for optional retirement date
                    const [lastName, firstName, lastName_kana, firstName_kana, employeeId, email, store, role, pincode, hourly_wage, retirementDate] = values;
                    batch.set(doc(collections.employees), { 
                        lastName, 
                        firstName, 
                        lastName_kana, 
                        firstName_kana, 
                        nickname: '', 
                        email, 
                        employeeId, 
                        store, 
                        role, 
                        pincode, 
                        hourly_wage, 
                        retirementDate: retirementDate || null, 
                        createdAt: serverTimestamp() 
                    });
                } else {
                    errorCount++;
                }
            });

            if (errorCount > 0) {
                showAlert("警告", `${errorCount}行のデータ形式が不正です。正しい形式のデータのみ登録処理を続行します。`);
            }
            try {
                await batch.commit();
                if (lines.length - errorCount > 0) {
                    showAlert("成功", `${lines.length - errorCount}名の従業員を一括登録しました。`);
                }
                hideModal(document.getElementById('bulk-import-modal'));
                e.target.reset();
                fetchEmployees();
            } catch (error) {
                console.error("Error with bulk import: ", error);
                showAlert("エラー", "一括登録中にエラーが発生しました。");
            }
        }
        
        async function addWorkItem(e) {
            e.preventDefault();
            const nameInput = document.getElementById('new-work-item-name');
            const timeInput = document.getElementById('new-work-item-time');
            const name = nameInput.value.trim();
            const time = timeInput.value;
            if (!name) return;

            const selectedTypes = Array.from(document.querySelectorAll('#work-type-checkboxes input:checked')).map(cb => cb.value);
            const selectedDays = Array.from(document.querySelectorAll('#add-work-item-days input.day-checkbox:checked')).map(cb => cb.value);

            try {
                await addDoc(collections.work_items, {
                    name,
                    appropriate_time: time ? parseInt(time, 10) : null,
                    associated_types: selectedTypes,
                    days_of_week: selectedDays,
                    createdAt: serverTimestamp()
                });
                nameInput.value = '';
                timeInput.value = '';
                document.querySelectorAll('#work-type-checkboxes input:checked').forEach(cb => cb.checked = false);
                document.querySelectorAll('#add-work-item-days input:checked').forEach(cb => cb.checked = false);
                fetchMasterData();
            } catch (error) {
                console.error("Error adding work item:", error);
                 showAlert("エラー", "作業項目の追加に失敗しました。");
            }
        }
        
        async function addWorkTime(e) {
            e.preventDefault();
            const form = e.target;
            const name = form['new-work-time-name'].value.trim();
            const category = form['new-work-time-category'].value.trim();
            const standard_time = form['new-work-time-standard-time'].value;
            
            if (!name || !category || !standard_time) {
                showAlert('入力エラー', 'すべてのフィールドを入力してください。');
                return;
            }
            try {
                await addDoc(collections.work_times, {
                    name,
                    category,
                    standard_time: parseInt(standard_time, 10),
                    createdAt: serverTimestamp()
                });
                form.reset();
                fetchMasterData();
            } catch (error) {
                console.error("Error adding work time:", error);
                showAlert("エラー", "作業時間の追加に失敗しました。");
            }
        }

        async function addFixture(e) {
            e.preventDefault();
            const form = e.target;
            const name = form['new-fixture-name'].value;
            if (!name) {
                showAlert('入力エラー', '什器名は必須です。');
                return;
            }
            try {
                await addDoc(collections.fixtures, {
                    name,
                    manufacturer: form['new-fixture-manufacturer'].value,
                    model_number: form['new-fixture-model-number'].value,
                    model_type: form['new-fixture-model-type'].value,
                    temp_min: form['new-fixture-temp-min'].value,
                    temp_max: form['new-fixture-temp-max'].value,
                    manual_drain: form['new-fixture-manual-drain'].checked,
                    createdAt: serverTimestamp()
                });
                form.reset();
                fetchMasterData();
            } catch (error) {
                console.error("Error adding fixture:", error);
                showAlert("エラー", "什器の追加に失敗しました。");
            }
        }

        async function addSkillCheck(e) {
            e.preventDefault();
            const nameInput = document.getElementById('new-skill-check-name');
            const name = nameInput.value.trim();
            const categorySelect = document.getElementById('skill-category-select');
            const category = categorySelect.value;
            
            if (!name) { showAlert('エラー','習得確認項目名を入力してください。'); return; }
            if (!category) { showAlert('エラー','所属する習得カテゴリを選択してください。'); return; }

            try {
                await addDoc(collections.skill_checks, {
                    name,
                    category,
                    createdAt: serverTimestamp()
                });
                nameInput.value = '';
                categorySelect.value = '';
                fetchMasterData();
            } catch (error) {
                console.error("Error adding skill check:", error);
                 showAlert("エラー", "習得確認項目の追加に失敗しました。");
            }
        }


        async function addMasterItem(e, inputIds, collectionRef, data) {
            e.preventDefault();
            
            const ids = Array.isArray(inputIds) ? inputIds : [inputIds];
            const nameInput = document.getElementById(ids[0]);
            
            if (nameInput.required && !nameInput.value.trim()) {
                showAlert('入力エラー', `${nameInput.placeholder}は必須です。`);
                return;
            }
            
            const dataToSave = { ...data, createdAt: serverTimestamp() };

            try {
                await addDoc(collectionRef, dataToSave);
                ids.forEach(id => { document.getElementById(id).value = ''; });
                fetchMasterData();
            } catch (error) {
                console.error("Error adding master item: ", error);
            }
        }

        async function deleteMasterItem(id, name, collectionRef) {
            showConfirmDialog(`マスタ項目「${name}」を削除しますか？`, async () => {
                try {
                    await deleteDoc(doc(collectionRef, id));
                    fetchMasterData();
                } catch (error) {
                    console.error(`Error deleting ${name}: `, error);
                }
            });
        }
        
        function updateDropdowns(selectElement, items) {
            const currentValue = selectElement.value;
            selectElement.innerHTML = '<option value="">選択してください</option>';
            const sortedItems = items.sort((a,b) => (a.name > b.name) ? 1 : -1);
            sortedItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                selectElement.appendChild(option);
            });
            if (currentValue) selectElement.value = currentValue;
        }

        function getRoleBadgeColor(role) {
            const colors = {
                'オーナー': 'bg-red-900 text-red-300',
                '店長': 'bg-blue-900 text-blue-300',
                'スタッフ': 'bg-green-900 text-green-300',
                '研修中': 'bg-yellow-900 text-yellow-300'
            };
            return colors[role] || 'bg-gray-700 text-gray-300';
        }

        function showModal(modalElement) {
            modalElement.classList.remove('hidden');
            setTimeout(() => {
                modalElement.classList.remove('opacity-0');
                modalElement.querySelector('div').classList.remove('scale-95');
            }, 10);
        }

        function hideModal(modalElement) {
            modalElement.classList.add('opacity-0');
            modalElement.querySelector('div').classList.add('scale-95');
            setTimeout(() => modalElement.classList.add('hidden'), 300);
        }

        function showConfirmDialog(message, onConfirm) {
            const dialog = document.getElementById('confirm-dialog');
            dialog.querySelector('#confirm-title').textContent = '確認';
            dialog.querySelector('#confirm-message').textContent = message;
            const buttons = dialog.querySelector('#confirm-buttons');
            buttons.innerHTML = `<button id="confirm-cancel" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition">いいえ</button><button id="confirm-ok" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">はい</button>`;
            showModal(dialog);
            buttons.querySelector('#confirm-cancel').onclick = () => hideModal(dialog);
            buttons.querySelector('#confirm-ok').onclick = () => { onConfirm(); hideModal(dialog); };
        }
        
        function showAlert(title, message) {
            const dialog = document.getElementById('confirm-dialog');
            dialog.querySelector('#confirm-title').textContent = title;
            dialog.querySelector('#confirm-message').textContent = message;
            const buttons = dialog.querySelector('#confirm-buttons');
            buttons.innerHTML = `<button id="alert-ok" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition">OK</button>`;
            showModal(dialog);
            buttons.querySelector('#alert-ok').onclick = () => hideModal(dialog);
        }

        function populatePathInfo(dataId) {
            const listContainer = document.getElementById('collection-path-list');
            if(!listContainer) return;
            listContainer.innerHTML = '';
            if(!dataId) return;
            
            const basePath = `artifacts/${dataId}/public/data`;
            
            const collectionNames = {
                '従業員マスタ': 'employees',
                '店舗マスタ': 'stores',
                '役職マスタ': 'roles',
                '什器マスタ': 'fixtures',
                '作業種類マスタ': 'work_types',
                '作業項目マスタ': 'work_items',
                '作業時間マスタ': 'work_times',
                '商品カテゴリマスタ': 'product_categories',
                'イベントマスタ': 'events',
                '習得カテゴリマスタ': 'skill_categories',
                '習得確認マスタ': 'skill_checks',
                'トイレ掃除マスタ': 'toilet_cleaning',
                '引き継ぎマスタ': 'handovers',
                'HACCPマスタ': 'haccp',
            };

            for (const [key, value] of Object.entries(collectionNames)) {
                const fullPath = `${basePath}/${value}`;
                const div = document.createElement('div');
                div.className = 'bg-gray-700 p-3 rounded-lg flex items-center justify-between';
                div.innerHTML = `
                    <div>
                        <div class="font-semibold text-white">${key}</div>
                        <div class="text-xs text-gray-400 font-mono" id="path-${value}">${fullPath}</div>
                    </div>
                    <button class="copy-btn p-2 rounded-md hover:bg-gray-600" data-path="${fullPath}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1h-2a1 1 0 00-1 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h2a1 1 0 001-1V3z" />
                          <path d="M4 8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2-2H6a2 2 0 01-2-2V8z" />
                        </svg>
                    </button>
                `;
                listContainer.appendChild(div);
            }

            listContainer.addEventListener('click', e => {
                const copyBtn = e.target.closest('.copy-btn');
                if (copyBtn) {
                    const path = copyBtn.dataset.path;
                    const textArea = document.createElement("textarea");
                    textArea.value = path;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showAlert('コピー成功', `パスをクリップボードにコピーしました:\n${path}`);
                    } catch (err) {
                        showAlert('コピー失敗', 'クリップボードへのコピーに失敗しました。');
                    }
                    document.body.removeChild(textArea);
                }
            });
        }
        
        const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
        function createDayOfWeekCheckboxes(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';

            const everydayLabel = document.createElement('label');
            everydayLabel.className = 'flex items-center space-x-2 text-sm cursor-pointer text-yellow-400 col-span-4';
            const everydayCheckbox = document.createElement('input');
            everydayCheckbox.type = 'checkbox';
            everydayCheckbox.value = '毎日';
            everydayCheckbox.className = 'form-checkbox everyday-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500';
            everydayLabel.appendChild(everydayCheckbox);
            const everydaySpan = document.createElement('span');
            everydaySpan.textContent = '毎日';
            everydayLabel.appendChild(everydaySpan);
            container.appendChild(everydayLabel);

            const dayCheckboxes = [];
            daysOfWeek.forEach(day => {
                const label = document.createElement('label');
                label.className = 'flex items-center space-x-2 text-sm cursor-pointer text-gray-300';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = day;
                checkbox.className = 'form-checkbox day-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-rose-500 focus:ring-rose-500';
                dayCheckboxes.push(checkbox);
                label.appendChild(checkbox);
                const span = document.createElement('span');
                span.textContent = day;
                label.appendChild(span);
                container.appendChild(label);
            });

            everydayCheckbox.addEventListener('change', (e) => {
                dayCheckboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });

            dayCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    everydayCheckbox.checked = dayCheckboxes.every(dayCb => dayCb.checked);
                });
            });
        }

        async function deduplicateEmployees() {
            showConfirmDialog('同じ氏名とメールアドレスを持つ重複した従業員を削除します。この操作は元に戻せません。よろしいですか？', async () => {
                try {
                    const snapshot = await getDocs(collections.employees);
                    if (snapshot.empty) {
                        showAlert('情報', '従業員データがありません。');
                        return;
                    }

                    const uniqueEmployees = new Map();
                    const docsToDelete = [];

                    snapshot.docs.forEach(doc => {
                        const employee = doc.data();
                        const key = `${employee.lastName}-${employee.firstName}-${employee.email}`;
                        if (uniqueEmployees.has(key)) {
                            docsToDelete.push(doc.id);
                        } else {
                            uniqueEmployees.set(key, doc.id);
                        }
                    });

                    if (docsToDelete.length === 0) {
                        showAlert('成功', '重複した従業員は見つかりませんでした。');
                        return;
                    }

                    const batch = writeBatch(db);
                    docsToDelete.forEach(id => {
                        batch.delete(doc(collections.employees, id));
                    });
                    await batch.commit();

                    showAlert('成功', `${docsToDelete.length}件の重複した従業員データを削除しました。`);
                    fetchEmployees(); // Refresh the list

                } catch (error) {
                    console.error("Error deduplicating employees:", error);
                    showAlert('エラー', `重複削除中にエラーが発生しました: ${error.message}`);
                }
            });
        }

        // --- CSV Functionality ---
        const CSV_CONFIG = {
            employees: { headers: ['lastName', 'firstName', 'lastName_kana', 'firstName_kana', 'nickname', 'email', 'employeeId', 'pincode', 'store', 'role', 'hourly_wage', 'retirementDate']},
            stores: { headers: ['name'] },
            roles: { headers: ['name', 'assigned_tasks'] },
            fixtures: { headers: ['name', 'manufacturer', 'model_number', 'model_type', 'temp_min', 'temp_max', 'manual_drain'] },
            work_types: { headers: ['name'] },
            work_items: { headers: ['name', 'associated_types', 'days_of_week', 'appropriate_time'] },
            work_times: { headers: ['name', 'category', 'standard_time'] },
            product_categories: { headers: ['name'] },
            events: { headers: ['name'] },
            skill_categories: { headers: ['name'] },
            skill_checks: { headers: ['name', 'category'] },
            toilet_cleaning: { headers: ['name'] },
            handovers: { headers: ['name'] },
            haccp: { headers: ['name'] },
        };

        function getActiveCollectionName() {
            const activeTab = document.querySelector('#master-tabs .active');
            if (!activeTab) return null;
            const contentId = activeTab.getAttribute('href');
            return contentId.replace('#master-tab-content-', '').replace(/-/g, '_');
        }

        async function exportEmployeesToCSV() {
            const collectionName = 'employees';
            const config = CSV_CONFIG[collectionName];

            try {
                const snapshot = await getDocs(collections[collectionName]);
                if (snapshot.empty) {
                    showAlert('情報', 'エクスポートする従業員データがありません。');
                    return;
                }
                const data = snapshot.docs.map(doc => doc.data());
                
                let csvContent = config.headers.join(',') + '\n';

                data.forEach(item => {
                    const row = config.headers.map(header => {
                        let value = item[header] || ''; // Handle undefined/null values
                        if (typeof value === 'string' && value.includes(',')) {
                            return `"${value}"`;
                        }
                        return value;
                    });
                    csvContent += row.join(',') + '\n';
                });

                downloadCSV(csvContent, `employees_master.csv`);

            } catch (error) {
                console.error(`Error exporting ${collectionName}:`, error);
                showAlert('エクスポート失敗', `データの書き出し中にエラーが発生しました: ${error.message}`);
            }
        }

        async function exportActiveMasterToCSV() {
            const collectionName = getActiveCollectionName();
            if (!collectionName) {
                showAlert('エラー', 'エクスポートするマスタを選択してください。');
                return;
            }

            const config = CSV_CONFIG[collectionName];
            if (!config) {
                 showAlert('エラー', 'このマスタはエクスポートに対応していません。');
                 return;
            }

            try {
                const snapshot = await getDocs(collections[collectionName]);
                const data = snapshot.docs.map(doc => doc.data());
                
                let csvContent = config.headers.join(',') + '\n';

                data.forEach(item => {
                    const row = config.headers.map(header => {
                        let value = item[header];
                        if (Array.isArray(value)) {
                            return `"${value.join(';')}"`; // 配列はセミコロン区切りで囲む
                        }
                        if (typeof value === 'string' && value.includes(',')) {
                            return `"${value}"`; // カンマを含む文字列は囲む
                        }
                        return value;
                    });
                    csvContent += row.join(',') + '\n';
                });

                downloadCSV(csvContent, `${collectionName}_master.csv`);

            } catch (error) {
                console.error(`Error exporting ${collectionName}:`, error);
                showAlert('エクスポート失敗', `データの書き出し中にエラーが発生しました: ${error.message}`);
            }
        }

        function downloadCSV(csvContent, fileName) {
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
            const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        async function importEmployeesFromCSV(event) {
            const file = event.target.files[0];
            if (!file) return;

            const collectionName = 'employees';
            const config = CSV_CONFIG[collectionName];
            if (!config) {
                 showAlert('エラー', '従業員用のCSV設定が見つかりません。');
                 return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    showAlert('エラー', 'CSVにヘッダー行と少なくとも1つのデータ行が必要です。');
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim());
                const expectedHeaders = config.headers;
                if(headers.length !== expectedHeaders.length || !headers.every((h, i) => h === expectedHeaders[i])) {
                    showAlert('ヘッダー不一致', `CSVのヘッダーが正しくありません。\n期待されるヘッダー: ${expectedHeaders.join(',')}`);
                    return;
                }

                const batch = writeBatch(db);
                const dataLines = lines.slice(1);

                dataLines.forEach(line => {
                    const values = line.split(',');
                    const newItem = {};
                    headers.forEach((header, index) => {
                        newItem[header] = values[index] ? values[index].trim() : '';
                    });
                    const newDocRef = doc(collections[collectionName]);
                    batch.set(newDocRef, {...newItem, createdAt: serverTimestamp()});
                });

                try {
                    await batch.commit();
                    showAlert('インポート成功', `${dataLines.length}件の従業員データをインポートしました。`);
                    fetchEmployees(); // Refresh employee list
                } catch (error) {
                    console.error(`Error importing to ${collectionName}:`, error);
                    showAlert('インポート失敗', `データのインポート中にエラーが発生しました: ${error.message}`);
                } finally {
                    event.target.value = ''; // Reset file input
                }
            };
            reader.readAsText(file, 'UTF-8');
        }


        async function importCSVToActiveMaster(event) {
            const file = event.target.files[0];
            if (!file) return;

            const collectionName = getActiveCollectionName();
            if (!collectionName) {
                showAlert('エラー', 'インポートするマスタを選択してください。');
                return;
            }
             const config = CSV_CONFIG[collectionName];
             if (!config) {
                 showAlert('エラー', 'このマスタはインポートに対応していません。');
                 return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    showAlert('エラー', 'CSVにヘッダー行と少なくとも1つのデータ行が必要です。');
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim());
                // Check if headers match config
                const expectedHeaders = config.headers;
                if(headers.length !== expectedHeaders.length || !headers.every((h, i) => h === expectedHeaders[i])) {
                    showAlert('ヘッダー不一致', `CSVのヘッダーが正しくありません。\n期待されるヘッダー: ${expectedHeaders.join(',')}`);
                    return;
                }

                const batch = writeBatch(db);
                const dataLines = lines.slice(1);

                dataLines.forEach(line => {
                    const values = line.split(',');
                    const newItem = {};
                    headers.forEach((header, index) => {
                        let value = values[index] ? values[index].trim() : '';
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        
                        // データ型の変換
                        if (header === 'manual_drain') {
                            newItem[header] = value.toLowerCase() === 'true' || value === '要';
                        } else if (header === 'assigned_tasks' || header === 'associated_types' || header === 'days_of_week') {
                            newItem[header] = value ? value.split(';').map(s => s.trim()) : [];
                        } else if (header === 'standard_time') {
                             newItem[header] = value ? parseInt(value, 10) : null;
                        } else {
                            newItem[header] = value;
                        }
                    });
                    const newDocRef = doc(collections[collectionName]);
                    batch.set(newDocRef, {...newItem, createdAt: serverTimestamp()});
                });

                try {
                    await batch.commit();
                    showAlert('インポート成功', `${dataLines.length}件のデータをインポートしました。`);
                    fetchAllData(); // データを再読み込みして表示を更新
                } catch (error) {
                    console.error(`Error importing to ${collectionName}:`, error);
                    showAlert('インポート失敗', `データのインポート中にエラーが発生しました: ${error.message}`);
                } finally {
                     // Reset file input to allow re-uploading the same file
                    masterCsvImportInput.value = '';
                }
            };
            reader.readAsText(file, 'UTF-8');
        }

    </script>
</body>
</html>
