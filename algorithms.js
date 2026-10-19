const HEAD = '#include <vector>\nusing namespace std;\n\n';
const HEAD_ALG = '#include <vector>\n#include <algorithm>\nusing namespace std;\n\n';

function* bubbleGen(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { t: 'cmp', i: j, j: j + 1 };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        yield { t: 'swap', i: j, j: j + 1 };
      }
    }
    yield { t: 'done', i: n - 1 - i };
    if (!swapped) break;
  }
  yield { t: 'fin' };
}

function* selectionGen(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    yield { t: 'pivot', i: m };
    for (let j = i + 1; j < n; j++) {
      yield { t: 'cmp', i: j, j: m };
      if (a[j] < a[m]) {
        m = j;
        yield { t: 'pivot', i: m };
      }
    }
    yield { t: 'pivot', i: -1 };
    if (m !== i) {
      [a[i], a[m]] = [a[m], a[i]];
      yield { t: 'swap', i, j: m };
    }
    yield { t: 'done', i };
  }
  yield { t: 'fin' };
}

function* insertionGen(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { t: 'cmp', i: j - 1, j };
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        yield { t: 'swap', i: j - 1, j };
        j--;
      } else break;
    }
  }
  yield { t: 'fin' };
}

function* mergeRec(a, l, r) {
  if (l >= r) return;
  const m = (l + r) >> 1;
  yield* mergeRec(a, l, m);
  yield* mergeRec(a, m + 1, r);
  yield { t: 'range', l, r };
  const L = a.slice(l, m + 1);
  const R = a.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) {
    yield { t: 'cmp', i: k, j: m + 1 + j };
    if (L[i] <= R[j]) a[k] = L[i++];
    else a[k] = R[j++];
    yield { t: 'set', i: k, v: a[k] };
    k++;
  }
  while (i < L.length) {
    a[k] = L[i++];
    yield { t: 'set', i: k, v: a[k] };
    k++;
  }
  while (j < R.length) {
    a[k] = R[j++];
    yield { t: 'set', i: k, v: a[k] };
    k++;
  }
}

function* mergeGen(a) {
  yield* mergeRec(a, 0, a.length - 1);
  yield { t: 'fin' };
}

function* quickRec(a, lo, hi) {
  if (lo > hi) return;
  if (lo === hi) {
    yield { t: 'done', i: lo };
    return;
  }
  yield { t: 'range', l: lo, r: hi };
  yield { t: 'pivot', i: hi };
  let i = lo;
  for (let j = lo; j < hi; j++) {
    yield { t: 'cmp', i: j, j: hi };
    if (a[j] < a[hi]) {
      if (i !== j) {
        [a[i], a[j]] = [a[j], a[i]];
        yield { t: 'swap', i, j };
      }
      i++;
    }
  }
  yield { t: 'pivot', i: -1 };
  if (i !== hi) {
    [a[i], a[hi]] = [a[hi], a[i]];
    yield { t: 'swap', i, j: hi };
  }
  yield { t: 'done', i };
  yield* quickRec(a, lo, i - 1);
  yield* quickRec(a, i + 1, hi);
}

function* quickGen(a) {
  yield* quickRec(a, 0, a.length - 1);
  yield { t: 'fin' };
}

function* countingGen(a) {
  const n = a.length;
  const mx = Math.max(...a);
  const c = new Array(mx + 1).fill(0);
  for (let i = 0; i < n; i++) {
    yield { t: 'read', i };
    c[a[i]]++;
  }
  let k = 0;
  for (let v = 0; v <= mx; v++) {
    while (c[v]-- > 0) {
      a[k] = v;
      yield { t: 'set', i: k, v };
      yield { t: 'done', i: k };
      k++;
    }
  }
  yield { t: 'fin' };
}

function* radixGen(a) {
  const n = a.length;
  const mx = Math.max(...a);
  for (let exp = 1; Math.floor(mx / exp) > 0; exp *= 10) {
    const out = new Array(n);
    const cnt = new Array(10).fill(0);
    for (let i = 0; i < n; i++) {
      yield { t: 'read', i };
      cnt[Math.floor(a[i] / exp) % 10]++;
    }
    for (let d = 1; d < 10; d++) cnt[d] += cnt[d - 1];
    for (let i = n - 1; i >= 0; i--) {
      const d = Math.floor(a[i] / exp) % 10;
      out[--cnt[d]] = a[i];
    }
    for (let i = 0; i < n; i++) {
      a[i] = out[i];
      yield { t: 'set', i, v: a[i] };
    }
  }
  yield { t: 'fin' };
}

function* bucketGen(a) {
  const n = a.length;
  const mn = Math.min(...a);
  const mx = Math.max(...a);
  const k = Math.max(1, Math.floor(Math.sqrt(n)));
  const size = (mx - mn + 1) / k;
  const buckets = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    yield { t: 'read', i };
    buckets[Math.min(k - 1, Math.floor((a[i] - mn) / size))].push(a[i]);
  }
  let pos = 0;
  const segs = [];
  for (const b of buckets) {
    const s = pos;
    for (const v of b) {
      a[pos] = v;
      yield { t: 'set', i: pos, v };
      pos++;
    }
    segs.push([s, pos - 1]);
  }
  for (const [s, e] of segs) {
    if (e < s) continue;
    yield { t: 'range', l: s, r: e };
    for (let i = s + 1; i <= e; i++) {
      let j = i;
      while (j > s) {
        yield { t: 'cmp', i: j - 1, j };
        if (a[j - 1] > a[j]) {
          [a[j - 1], a[j]] = [a[j], a[j - 1]];
          yield { t: 'swap', i: j - 1, j };
          j--;
        } else break;
      }
    }
    for (let i = s; i <= e; i++) yield { t: 'done', i };
  }
  yield { t: 'fin' };
}

function* siftDown(a, n, i) {
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let m = i;
    if (l < n) {
      yield { t: 'cmp', i: l, j: m };
      if (a[l] > a[m]) m = l;
    }
    if (r < n) {
      yield { t: 'cmp', i: r, j: m };
      if (a[r] > a[m]) m = r;
    }
    if (m === i) return;
    [a[i], a[m]] = [a[m], a[i]];
    yield { t: 'swap', i, j: m };
    i = m;
  }
}

function* heapGen(a) {
  const n = a.length;
  for (let i = (n >> 1) - 1; i >= 0; i--) yield* siftDown(a, n, i);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    yield { t: 'swap', i: 0, j: end };
    yield { t: 'done', i: end };
    yield* siftDown(a, end, 0);
  }
  yield { t: 'fin' };
}

const ALGOS = {
  bubble: {
    name: 'BUBBLE SORT',
    tags: ['KARŞILAŞTIRMA TABANLI', 'IN-PLACE', 'STABLE'],
    desc: 'Yan yana duran iki elemanı karşılaştırır, yanlış sıradaysa yerlerini değiştirir. Her turda en büyük eleman bir baloncuk gibi dizinin sonuna doğru yükselir.',
    steps: [
      'Dizinin başından başla.',
      'Yan yana olan iki elemanı karşılaştır.',
      'Soldaki sağdakinden büyükse yer değiştir.',
      'Dizinin sonuna kadar devam et, en büyük eleman sona yerleşir.',
      'Sıralı kısmı dışarıda bırakarak tekrarla.',
      'Bir turda hiç takas olmazsa dizi sıralıdır, dur.'
    ],
    cx: { best: ['O(n)', 'good'], avg: ['O(n^2)', 'bad'], worst: ['O(n^2)', 'bad'], space: ['O(1)', 'good'] },
    stable: true,
    inplace: true,
    gen: bubbleGen,
    code: HEAD + `void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                swap(a[j], a[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`
  },
  selection: {
    name: 'SELECTION SORT',
    tags: ['KARŞILAŞTIRMA TABANLI', 'IN-PLACE', 'UNSTABLE'],
    desc: 'Sıralanmamış kısımdaki en küçük elemanı bulur ve sıralanmamış kısmın başına koyar. Takas sayısı en fazla n-1 olduğu için yazma işlemi pahalı olduğunda işe yarar.',
    steps: [
      'Sıralanmamış kısmın ilk elemanını geçici minimum kabul et.',
      'Kalan elemanları tek tek minimumla karşılaştır.',
      'Daha küçük bir eleman bulursan yeni minimum o olur.',
      'Tur bitince minimumu sıralanmamış kısmın başıyla takas et.',
      'Sıralı kısım bir eleman büyüdü, tekrarla.'
    ],
    cx: { best: ['O(n^2)', 'bad'], avg: ['O(n^2)', 'bad'], worst: ['O(n^2)', 'bad'], space: ['O(1)', 'good'] },
    stable: false,
    inplace: true,
    gen: selectionGen,
    code: HEAD + `void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swap(a[i], a[minIdx]);
        }
    }
}`
  },
  insertion: {
    name: 'INSERTION SORT',
    tags: ['KARŞILAŞTIRMA TABANLI', 'IN-PLACE', 'STABLE'],
    desc: 'Elindeki iskambil kağıtlarını sıralar gibi çalışır. Her yeni elemanı, solundaki zaten sıralı olan kısımda doğru yere kaydırarak yerleştirir. Neredeyse sıralı dizilerde çok hızlıdır.',
    steps: [
      'İlk elemanı tek başına sıralı kabul et.',
      'Sıradaki elemanı al.',
      'Solundaki sıralı kısımda kendinden büyük olanları bir sağa kaydır.',
      'Elemanı açılan boşluğa yerleştir.',
      'Dizinin sonuna kadar tekrarla.'
    ],
    cx: { best: ['O(n)', 'good'], avg: ['O(n^2)', 'bad'], worst: ['O(n^2)', 'bad'], space: ['O(1)', 'good'] },
    stable: true,
    inplace: true,
    gen: insertionGen,
    code: HEAD + `void insertionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}`
  },
  merge: {
    name: 'MERGE SORT',
    tags: ['DIVIDE AND CONQUER', 'OUT-OF-PLACE', 'STABLE'],
    desc: 'Diziyi tek elemanlı parçalar kalana kadar sürekli ikiye böler, sonra bu parçaları sıralı şekilde birleştirerek geri çıkar. Her durumda O(n log n) çalışır ama ekstra dizi gerektirir.',
    steps: [
      'Diziyi ortadan ikiye böl.',
      'Sol yarıyı aynı yöntemle sırala.',
      'Sağ yarıyı aynı yöntemle sırala.',
      'İki sıralı yarının başındaki elemanları karşılaştır.',
      'Küçük olanı sonuç dizisine yaz, o yarıda bir ilerle.',
      'Bir yarı bitince diğerinin kalanını sona ekle.'
    ],
    cx: { best: ['O(n log n)', 'mid'], avg: ['O(n log n)', 'mid'], worst: ['O(n log n)', 'mid'], space: ['O(n)', 'bad'] },
    stable: true,
    inplace: false,
    gen: mergeGen,
    code: HEAD + `void merge(vector<int>& a, int l, int m, int r) {
    vector<int> left(a.begin() + l, a.begin() + m + 1);
    vector<int> right(a.begin() + m + 1, a.begin() + r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) {
            a[k++] = left[i++];
        } else {
            a[k++] = right[j++];
        }
    }
    while (i < left.size()) a[k++] = left[i++];
    while (j < right.size()) a[k++] = right[j++];
}

void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    merge(a, l, m, r);
}`
  },
  quick: {
    name: 'QUICK SORT',
    tags: ['DIVIDE AND CONQUER', 'IN-PLACE', 'UNSTABLE'],
    desc: 'Bir pivot seçer, pivottan küçükleri soluna büyükleri sağına toplar. Böylece pivot kesin yerine oturur. Sonra sol ve sağ parçalar aynı şekilde sıralanır. Pratikte en hızlı algoritmalardan biridir.',
    steps: [
      'Aralığın son elemanını pivot seç.',
      'Pivottan küçük elemanları aralığın soluna topla.',
      'Pivotu küçüklerin hemen sağına koy, artık yeri kesin.',
      'Pivotun solundaki parçayı aynı yöntemle sırala.',
      'Pivotun sağındaki parçayı aynı yöntemle sırala.'
    ],
    cx: { best: ['O(n log n)', 'mid'], avg: ['O(n log n)', 'mid'], worst: ['O(n^2)', 'bad'], space: ['O(log n)', 'good'] },
    stable: false,
    inplace: true,
    gen: quickGen,
    code: HEAD + `int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi];
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {
            swap(a[i], a[j]);
            i++;
        }
    }
    swap(a[i], a[hi]);
    return i;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}`
  },
  counting: {
    name: 'COUNTING SORT',
    tags: ['FREKANS', 'OUT-OF-PLACE', 'STABLE'],
    desc: 'Elemanları hiç karşılaştırmaz. Her değerin kaç kez geçtiğini bir sayaç dizisinde tutar, sonra bu sayılara bakarak elemanları doğru yerlere yazar. Değer aralığı (k) küçükse çok hızlıdır.',
    steps: [
      'En büyük değeri bul ve o boyutta bir sayaç dizisi aç.',
      'Diziyi gez, her değerin sayacını bir artır.',
      'Sayaçları kümülatif topla, her değerin bitiş konumu çıkar.',
      'Diziyi sondan başa gezip her elemanı konumuna yaz.',
      'Sonuç dizisini orijinal diziye kopyala.'
    ],
    cx: { best: ['O(n + k)', 'good'], avg: ['O(n + k)', 'good'], worst: ['O(n + k)', 'good'], space: ['O(n + k)', 'bad'] },
    stable: true,
    inplace: false,
    gen: countingGen,
    code: HEAD_ALG + `void countingSort(vector<int>& a) {
    if (a.empty()) return;
    int maxVal = *max_element(a.begin(), a.end());
    vector<int> count(maxVal + 1, 0);
    for (int x : a) count[x]++;
    for (int i = 1; i <= maxVal; i++) count[i] += count[i - 1];
    vector<int> output(a.size());
    for (int i = a.size() - 1; i >= 0; i--) {
        output[--count[a[i]]] = a[i];
    }
    a = output;
}`
  },
  radix: {
    name: 'RADIX SORT',
    tags: ['FREKANS', 'OUT-OF-PLACE', 'STABLE'],
    desc: 'Sayıları basamak basamak sıralar. Önce birler basamağına, sonra onlar, sonra yüzler basamağına göre stable bir sıralama (genelde counting sort) uygular. Son basamaktan sonra dizi tamamen sıralı olur.',
    steps: [
      'En büyük sayının basamak sayısını bul.',
      'Birler basamağına göre stable şekilde sırala.',
      'Onlar basamağına göre stable şekilde sırala.',
      'En büyük basamağa kadar devam et.',
      'Stable olduğu için önceki basamakların sırası korunur.'
    ],
    cx: { best: ['O(d·(n + k))', 'good'], avg: ['O(d·(n + k))', 'good'], worst: ['O(d·(n + k))', 'good'], space: ['O(n + k)', 'bad'] },
    stable: true,
    inplace: false,
    gen: radixGen,
    code: HEAD_ALG + `void countByDigit(vector<int>& a, int exp) {
    int n = a.size();
    vector<int> output(n);
    int count[10] = {0};
    for (int i = 0; i < n; i++) count[(a[i] / exp) % 10]++;
    for (int i = 1; i < 10; i++) count[i] += count[i - 1];
    for (int i = n - 1; i >= 0; i--) {
        int d = (a[i] / exp) % 10;
        output[--count[d]] = a[i];
    }
    a = output;
}

void radixSort(vector<int>& a) {
    if (a.empty()) return;
    int maxVal = *max_element(a.begin(), a.end());
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        countByDigit(a, exp);
    }
}`
  },
  bucket: {
    name: 'BUCKET SORT',
    tags: ['FREKANS', 'OUT-OF-PLACE', 'STABLE'],
    desc: 'Değer aralığını eşit parçalara (kovalara) böler ve her elemanı ait olduğu kovaya atar. Her kova kendi içinde (genelde insertion sort ile) sıralanır, sonra kovalar sırayla birleştirilir. Veri düzgün dağılmışsa çok hızlıdır.',
    steps: [
      'En küçük ve en büyük değeri bul, aralığı k kovaya böl.',
      'Her elemanı değerine göre ilgili kovaya at.',
      'Kovaları sırayla diziye geri yaz.',
      'Her kovayı kendi içinde insertion sort ile sırala.',
      'Tüm kovalar sıralanınca dizi sıralıdır.'
    ],
    cx: { best: ['O(n + k)', 'good'], avg: ['O(n + k)', 'good'], worst: ['O(n^2)', 'bad'], space: ['O(n + k)', 'bad'] },
    stable: true,
    inplace: false,
    gen: bucketGen,
    code: '#include <vector>\n#include <algorithm>\n#include <cmath>\nusing namespace std;\n\n' + `void bucketSort(vector<int>& a) {
    int n = a.size();
    if (n == 0) return;
    int minVal = *min_element(a.begin(), a.end());
    int maxVal = *max_element(a.begin(), a.end());
    int k = max(1, (int)sqrt(n));
    double range = (double)(maxVal - minVal + 1) / k;
    vector<vector<int>> buckets(k);
    for (int x : a) {
        int idx = min(k - 1, (int)((x - minVal) / range));
        buckets[idx].push_back(x);
    }
    int pos = 0;
    for (auto& b : buckets) {
        for (int i = 1; i < b.size(); i++) {
            int key = b[i];
            int j = i - 1;
            while (j >= 0 && b[j] > key) {
                b[j + 1] = b[j];
                j--;
            }
            b[j + 1] = key;
        }
        for (int x : b) a[pos++] = x;
    }
}`
  },
  heap: {
    name: 'HEAP SORT',
    tags: ['AĞAÇ YAPILI', 'IN-PLACE', 'UNSTABLE'],
    desc: 'Diziyi bir max heap (ikili ağaç) yapısına çevirir. Ağacın kökündeki en büyük elemanı dizinin sonuna atar, kalan kısımda heap yapısını tekrar düzeltir. Ekstra hafıza kullanmadan her durumda O(n log n) çalışır.',
    steps: [
      'Diziyi max heap haline getir (her ebeveyn çocuklarından büyük).',
      'Kökteki en büyük elemanı son elemanla takas et.',
      'Heap boyutunu bir azalt, son eleman artık sıralı.',
      'Yeni kökü aşağı doğru kaydırarak heap yapısını düzelt.',
      'Heap boyutu 1 olana kadar tekrarla.'
    ],
    cx: { best: ['O(n log n)', 'mid'], avg: ['O(n log n)', 'mid'], worst: ['O(n log n)', 'mid'], space: ['O(1)', 'good'] },
    stable: false,
    inplace: true,
    gen: heapGen,
    code: HEAD + `void heapify(vector<int>& a, int n, int i) {
    int largest = i;
    int l = 2 * i + 1;
    int r = 2 * i + 2;
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest != i) {
        swap(a[i], a[largest]);
        heapify(a, n, largest);
    }
}

void heapSort(vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--) heapify(a, n, i);
    for (int i = n - 1; i > 0; i--) {
        swap(a[0], a[i]);
        heapify(a, i, 0);
    }
}`
  }
};
