/*

	Copyright © 2017 Siverus production
	Author: Andrey Trokhlebov (Siv)

	Условия использования ПО: Автор разрешает использовать данный код для ознакомления и личного использования. Так же автор не дает разрешение на публикацию, распространение, сублиценизрование и продажу данного ПО. При нарушении приведенных условий использования данного ПО, нарушитель признается Пидором. 

*/

//Мутим конструктор и объявляем массив для хранения всей необходимой инфы о блоках
function Block (InputId, InputData)
{
	this.Id = InputId;
	this.Data = InputData;
	this.X = 0;
	this.Y = 0;
	this.Z = 0;
}

var Blocks = [];
var FileName = '';

// чекаем поддержку file api
if (window.File && window.FileReader && window.FileList && window.Blob) {}
else
{
  alert('The File APIs are not fully supported in this browser.');
}

//Обработка получения файла
 function receivingFile(evt)
 {
    var files = evt.target.files;
    var reader = new FileReader();
    reader.readAsBinaryString(evt.target.files[0]);

    //обрабатываем получение файла
    reader.onload = function()
    {
    	var Elements = document.getElementsByClassName('GenerateForm');
    	if(handlingFile(reader.result))
    	{
    		document.getElementById('output').innerHTML = "Schematic успешно прочитан";
    		document.getElementById('output').style.color = '#2ead20';
    		for (var i = 0; i < Elements.length; i++) Elements[i].style.display = 'block';
    		FileName = evt.target.files[0].name.split('.')[0];
    	}
    	else
    	{
    		document.getElementById('output').innerHTML = "Какой-то странный schematic";
    		document.getElementById('output').style.color = '#e52d2d';
    		for (var i = 0; i < Elements.length; i++) Elements[i].style.display = 'none';

    	}
    }
}

//Обработка файла и заполнение Blocks
function handlingFile(FileContent)
{
	//распаковываем файл и мутим для его содержимого строковую версию
	var FileData;
	try
	{
		FileData = pako.inflate(FileContent);
	}
	catch (e)
	{
		return false;
	}
	var StrFileData = String.fromCharCode.apply(null, FileData);

	//объявляем переменные для всей инфы, которую надо взять из файла

	//константины
	var X = 0;
	var Y = 1;
	var Z = 2;
	var TAGS = ['Blocks','Data','Width','Height','Length','WEOffsetX','WEOffsetY','WEOffsetZ']; //теги, которые нам нужно найти

	//переменные
	var Index = 0;
	var UnorderedBlocks = [[],[]];
	var Size = [0, 0, 0];
	var Offset = [0, 0, 0];

	//собираем значения тегов
	for(var i = 0; i<TAGS.length; i++)
	{
		Index = StrFileData.indexOf(TAGS[i]);
		if(Index == -1)
		{
			console.log('Тег ',TAGS[i],' не найден.');
			return false;
		}
		else
		{
			console.log('Тег ',TAGS[i],' найден на позиции ', Index);
			Index += TAGS[i].length;

			switch(TAGS[i])
			{
				case 'Blocks':
				case 'Data':
					var ArrSize = byteToNum(FileData.slice(Index, Index+4));
					console.log('Длина массива Blocks: ', ArrSize);
					Index += 4;

					for (var j = 0; j < ArrSize; j++)
					{
						UnorderedBlocks[i][j] = FileData[Index];
						Index++;
					}
					break;

				case 'Width':
				case 'Height':
				case 'Length':
					Size[i-2] = byteToNum(FileData.slice(Index, Index+2));
					break;

				case 'WEOffsetX':
				case 'WEOffsetY':
				case 'WEOffsetZ':
					Offset[i-5] = byteToNum(FileData.slice(Index, Index+4));
					break;

				default:
					break;
			}
		}
	}

	console.log(UnorderedBlocks);
	console.log(Size);
	console.log(Offset);

	//Составляем упорядоченный список блоков
	Blocks = [];
	for (var i = 0; i < UnorderedBlocks[0].length; i++)
	{
		Blocks.push(new Block(UnorderedBlocks[0][i], UnorderedBlocks[1][i]));
	}

	for (var y = 0, BlocksIndex = 0; y < Size[Y]; y++)
	{
		for (var z = 0; z < Size[Z]; z++)
		{
			for (var x = 0; x < Size[X]; x++)
			{
				Blocks[BlocksIndex].X = x + Offset[X];
				Blocks[BlocksIndex].Y = y + Offset[Y];
				Blocks[BlocksIndex].Z = z + Offset[Z];
				BlocksIndex++;
			}
		}
	}

	console.log(Blocks.length);
	return true;
}

//генериратор mcfunction
function generator()
{
	document.getElementById('DownloadMcfunction').style.display = 'none';

	//считываем и валидируем селектор
	var Selector = document.getElementById('Selector').value;
	if (Selector == '')
	{
		document.getElementById('GenerateFormOutput').innerHTML = 'Селектор нужно заполнить. Например, "@s"';
		return 0;
	}
	else
	{
		if(Selector[0] != '@' || (Selector[1] != 'a' && Selector[1] != 'p' && Selector[1] != 'e' && Selector[1] != 's' && Selector[1] != 'r'))
		{
			document.getElementById('GenerateFormOutput').innerHTML = "Это не селектор";
			return 0;
		}
		else document.getElementById('GenerateFormOutput').innerHTML = "";
	}
	console.log('Selector: ' + Selector);

	//считываем параметр строительства воздуха
	var BuildAir = document.getElementById('BuildAir').checked;
	console.log('BuildAir: ' + BuildAir);

	//составляем список комманд
	var Commands = '';
	for (var i = 0; i < Blocks.length; i++)
	{
		if(Blocks[i].Id == 0 && !BuildAir) continue;
		else
		{
			var Command = 'execute ' + Selector + ' ~ ~ ~ setblock ~' + Blocks[i].X + ' ~' + Blocks[i].Y + ' ~' + Blocks[i].Z + ' ' + StringIds[Blocks[i].Id] + ' ' + Blocks[i].Data + '\n';
			Commands += Command;
		}
	}

	//мутим файл mcfunction и ссылку
	var File = new Blob([Commands]);
	var Link = document.getElementById('DownloadMcfunctionLink');
	Link.href = URL.createObjectURL(File);
	Link.download = FileName + '.mcfunction';
	console.log('Заебись');
	return true;
}

//хуйня для преобразования нескольких байт в num
function byteToNum(ByteArray)
{
    var Value = 0;
    if(ByteArray[0] < 128)
	    for ( var i = 0; i < ByteArray.length; i++)
	    {
	        Value = (Value * 256) + ByteArray[i];
	    }
    else
    {
    	for ( var i = 0; i < ByteArray.length; i++)
	    {
	        Value = (Value * 256) - (255-ByteArray[i]);
	    }
	    Value--;
	}
    return Value;
};