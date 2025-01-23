import prisma from './prisma';

const createCategories = async () => {
	await prisma.category.createMany({
		data: [
			{ name: 'Computer Science' },
			{ name: 'Music' },
			{ name: 'Fitness' },
			{ name: 'Photography' },
			{ name: 'Accounting' },
			{ name: 'Engineering' },
			{ name: 'Filming' },
		],
	});
};

async function main() {
	try {
		await createCategories();
		console.log('👻 created categories');
	} catch (e) {
		console.error(e);
	}
}

main();
